const MiddlewareGroup = require("./middlewareGroup"),
	  {EventEmitter}  = require("events"),
	  ErrorHandler    = require("./errorHandler"),
	  requireAll      = require("require-all"),
	  HTTPError       = require("http-errors"),
	  Container       = require("./container"),
	  express         = require("express"),
	  Sentry          = require("@sentry/node"),
	  morgan          = require("morgan"),
	  util            = require("util"),
	  http            = require("http"),
	  pug             = require("pug"),
	  _               = require("lodash");


/*---------------------------------------------------------------------------
	Constants
---------------------------------------------------------------------------*/
const BASE_MIDDLEWARE = [
	require("../middleware/helper"),
	require("../middleware/parsePageNumber"),
	require("../middleware/routing"),
	require("../middleware/session"),
	require("../middleware/flash"),
	require("../middleware/auth"),
	require("../middleware/fileUpload"),
	require("../middleware/csrf")
];

const DEFAULT_BODYPARSER_URLENCODED_SETTINGS = {extended: false, limit: "8mb"};
const DEFAULT_BODYPARSER_JSON_SETTINGS = {};


/*---------------------------------------------------------------------------
	The main Axis app class
---------------------------------------------------------------------------*/
module.exports = class App extends EventEmitter {
	constructor(opts = {}) {
		super();

		this._express = express();
		this._expressOptions = opts.app ?? {};

		this._rawMiddleware = opts.middleware;
		this._controllersDir = opts.controllers;
		this._routerFactories = opts.routers;
		this._errorHandlers = opts.handlers;

		this._registerContainer(opts.container);
	}

	_registerContainer(container) {
		if(!(container instanceof Container)) {
			throw new Error("The provided container is not an instance of the Axis container class.");
		}

		this._container = container;
		this._container._mount(this);
	}

	_registerMiddleware() {
		this._middleware = new Map();
		this._middleware.set("base", new MiddlewareGroup("base", BASE_MIDDLEWARE, this));

		if(_.isPlainObject(this._rawMiddleware)) {
			for(let name in this._rawMiddleware) {
				this._middleware.set(name, new MiddlewareGroup(name, this._rawMiddleware[name], this));
			}
		}
	}

	_registerErrorHandlers() {
		let appErrorHandler = ErrorHandler.initFrom(this._errorHandlers.applicationError, this);
		let httpErrorHandler = ErrorHandler.initFrom(this._errorHandlers.httpError, this);

		//Delegate not found pages to our actual error handler
		this._express.use((req, res, next) => {
			req.handler = this._routers[0]._routes[0]._requestHandler;

			req.handler
				._runMiddleware(req, res)
				.then(success => {
					if(success) {
						next(new HTTPError.NotFound());
					}
				})
				.catch(next);
		});

		//Handle explicitly non-HTTP errors, this handler should always throw an HTTP error from within it
		this._express.use((err, req, res, next) => {
			if(HTTPError.isHttpError(err))
				return next(err);

			appErrorHandler
				.execute(err, req, res)
				.then(() => next(HTTPError(500, err, {message: "Application error handler did not throw an HTTP error"})))
				.catch(next);
		});

		this._express.use(Sentry.Handlers.errorHandler());

		//Handle all HTTP errors
		this._express.use((err, req, res, next) => {
			if(HTTPError.isHttpError(err)) {
				httpErrorHandler
					.execute(err, req, res)
					.catch(next);
			} else {
				next(err);
			}
		});
	}

	_registerControllers() {
		this._controllers = requireAll({
			dirname: this._controllersDir,
			filter: /(.+Controller)\.js$/,
			excludeDirs: /^\.(git|svn)$/,
			resolve: (Controller) => {
				let c = new Controller(this);

				Object.getOwnPropertyNames(Controller.prototype)
					.filter(name => name !== "constructor")
					.forEach(name => c[name]._controller = c);

				return c;
			}
		});
	}

	_registerRouters() {
		this._routers = [];

		for(let i = 0; i < this._routerFactories.length; i++) {
			let fn = this._routerFactories[i];

			let router = fn(this._controllers, this._container.database.models);
			router.prependMiddleware("base");
			router._mount(this);

			this._routers.push(router);
		}
	}

	_bootstrapExpressApp() {
		this.emit("preExpressInit");

		this._express.enable("trust proxy");

		this._express.use(Sentry.Handlers.requestHandler(this._expressOptions.sentry?.requestHandlerOptions ?? {}));
		this._express.use(express.urlencoded(this._expressOptions.bodyParser?.urlencoded ?? DEFAULT_BODYPARSER_URLENCODED_SETTINGS));
		this._express.use(express.json(this._expressOptions.bodyParser?.json ?? DEFAULT_BODYPARSER_JSON_SETTINGS));

		if(this._expressOptions.logging) {
			this._express.use(morgan("tiny"));
		}

		if(this._expressOptions.staticContentRoot) {
			this._express.use(express.static(this._expressOptions.staticContentRoot));
		}

		if(this._expressOptions.viewRoot) {
			this._express.engine("pug", pug.__express);
			this._express.set("view engine", "pug");
			this._express.set("views", this._expressOptions.viewRoot);
			this._express.locals.basedir = this._express.get("views");
		}

		this.emit("postExpressInit");
	}

	async listen(...args) {
		await this._container._initialize();

		if(!this._container.database) {
			throw new Error("No database assigned to Axis container.");
		}

		this._bootstrapExpressApp();
		this._registerMiddleware();
		this._registerControllers();
		this._registerRouters();
		this._registerErrorHandlers();

		//Start HTTP server
		this._server = http.createServer(this._express);
		this.emit("serverCreated", this._server);
		await util.promisify(this._server.listen.bind(this._server))(...args);
	}
};
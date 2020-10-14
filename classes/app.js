/*---------------------------------------------------------------------------
	Module imports
---------------------------------------------------------------------------*/
const express = require("express"),
	requireAll = require("require-all"),
	multer = require("multer"),
	csurf = require("csurf"),
	http = require("http"),
	util = require("util"),
	Request = require("./request"),
	Response = require("./response"),
	pathToRegexp = require("path-to-regexp"),
	path = require("path");

const PugViewEngine = require("../viewEngines/pug");
const BodyParser = require("../middleware/bodyParser");
const RouteModelBinder = require("../middleware/routeModelBinder");
const RouteHelper = require("../middleware/routeHelper");


/*---------------------------------------------------------------------------
	Main app class
---------------------------------------------------------------------------*/
module.exports = class App {
	constructor(opts = {}) {
		this._initDefaultSettings();

		this._server = http.createServer(this._handleRequest.bind(this));

		this._middleware = opts.middleware;
		this._middleware.base = [
			new BodyParser(),
			new RouteModelBinder(),
			new RouteHelper()
		];

		this._container = opts.container;
		this._container.app = this;
		this._container.initialize();

		this._controllers = requireAll({
			dirname: opts.controllers,
			filter: /(.+Controller)\.js$/,
			excludeDirs: /^\.(git|svn)$/,
			resolve: (Controller) => {
				let controller = new Controller(this);
				opts.container.attachAll(controller);

				Object.getOwnPropertyNames(Controller.prototype)
					.forEach(name => {
						if(name === "constructor") return;
						controller[name].controller = controller;
					});

				return controller;
			}
		});

		//Bail if a database is not set
		if(!this._database) {
			throw new Error("App does not have a database assigned to it!");
		}

		//Load routers
		this._routers = [];
		opts.routers.forEach(r => this.addRouter(r));
	}

	_initDefaultSettings() {
		this.settings.url = process.env.APP_URL;
		this.settings.baseViewDirectory = path.join(process.cwd(), "./resources/views");
		this.settings.viewEngine = new PugViewEngine(this);
	}

	get settings() {
		if(this._settings) return this._settings;

		let map = new Map();
		this._settings = new Proxy({}, {
			get: (target, prop) => {
				return map.get(prop);
			},
			set: (target, prop, val) => {
				map.set(prop, val);
				return true;
			}
		});

		return this._settings;
	}

	setDatabase(db) {
		this._database = db;
		return this;
	}

	addRouter(fn) {
		let router = fn(this._controllers, this._database.models);
		router._mount(this);

		this._routers.push(router);

		return this;
	};

	async _handleRequest(_req, _res) {
		let req = new Request(_req, this);
		let res = new Response(_res, this);

		try {
			for(let i = 0; i < this._routers.length; i++) {
				let router = this._routers[i];

				for(let [path, route] of router._routeCache) {
					if(!path.startsWith(req.method)) continue;

					//Attempt to match route
					let match = pathToRegexp.match(route._fullPath, {decode: decodeURIComponent});
					let matched = match(req.path.pathname.endsWith("/") ? req.path.pathname : (req.path.pathname + "/"));

					if(matched) {
						req._route = route;
						req._params = matched.params;

						//Run middleware
						for(let name of route._middleware) {
							await this._runMiddleware(name, req, res, route._middlewareArgs.get(name));
						}

						//Run route logic
						return await route._execute(req, res);
					}
				}
			}
		} catch(e) {
			await this._handleError(e, req, res);
		}
	}

	async _runMiddleware(name, req, res, args) {
		if(!this._middleware[name]) throw new Error(`Trying to use non-existant middleware "${name}"`);

		for(let i = 0; i < this._middleware[name].length; i++) {
			let mw = this._middleware[name][i];
			console.log(`RUNNING MIDDLEWARE "${name}":`, mw.constructor.name);
			await mw._exec(req, res, args);
		}
	}

	async _handleError(err, req, res) {
		console.error(err);
		return res.status(500).send(err.stack);
	}

	get listen() {
		return util.promisify(this._server.listen.bind(this._server));
	}
}
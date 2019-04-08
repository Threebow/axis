const express = require("express"),
	  requireAll = require("require-all"),
	  bodyParser = require("body-parser"),
	  cookieParser = require("cookie-parser"),
	  session = require("express-session"),
	  flash = require("express-flash");

module.exports = function createServer(settings) {
	let app = express();
	app._controllers = {};

	app.setDatabase = (db) => {
		app._database = db;
	};

	app.setControllers = (dir) => {
		app._controllers = requireAll({
			dirname: dir,
			filter: /(.+Controller)\.js$/,
			excludeDirs: /^\.(git|svn)$/,
			resolve: (Controller) => {
				let controller = new Controller(app);

				Object.getOwnPropertyNames(Controller.prototype).forEach(name => {
					if(name === "constructor") return;
					controller[name].controller = controller;
				});

				return controller;
			}
		});
	};

	app.addRouter = (fn) => {
		let router = fn(app._controllers, app._database.models);
		let r = router.register();
		app.use(r);
	};

	//Set stuff up
	app.setDatabase(settings.database);
	app.setControllers(settings.controllers);
	settings.routers.forEach(r => app.addRouter(r));

	//Configuring express
	app.use(express.static(settings.publicDir));
	app.use(bodyParser.urlencoded(settings.bodyParser || {extended: false, limit: "8mb"}));
	app.use(bodyParser.json());
	app.use(cookieParser());

	app.use(session(settings.session || {resave: false, saveUninitialized: false}));

	app.use(flash());

	app.engine(settings.viewEngineName, settings.viewEngine.__express);
	app.set("view engine", settings.viewEngineName);
	app.set("views", settings.viewDir);

	return app;
};
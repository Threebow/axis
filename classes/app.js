const express = require("express"),
	  requireAll = require("require-all"),
	  MiddlewareGroup = require("./middlewareGroup"),
	  multer = require("multer"),
	  csurf = require("csurf");

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
				settings.container.attachAll(controller);

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
		router.app = app;
		router._registerHelperMiddleware(app);
		router._register(app);
	};

	//Pass the app to the container and initialize it
	settings.container.app = app;
	settings.container.initialize();

	//Bail if a database is not set
	if(!app._database) {
		throw new Error("App does not have a database assigned to it!");
	}

	//Load middleware
	app.middleware = {};
	for(let name in settings.middleware || {}) {
		if(!settings.middleware.hasOwnProperty(name)) continue;

		//Create a new middleware group and add it to the app's middleware stack
		app.middleware[name] = new MiddlewareGroup(name, settings.middleware[name]);
	}

	//Setup multer
	if(settings.multerSettings) {
		app._multer = multer(settings.multerSettings);
	}

	//Setup csurf
	if(settings.csrf) {
		if(settings.csrf === true) {
			app._csurf = csurf();
		} else {
			app._csurf = csurf(settings.csrf);
		}
	}

	//Set stuff up
	app.setControllers(settings.controllers);
	settings.routers.forEach(r => app.addRouter(r));

	return app;
};
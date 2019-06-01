const express = require("express"),
	  requireAll = require("require-all");

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
		app.use(router._register(express.Router()));
	};

	//Pass the app to the container and initialize it
	settings.container.app = app;
	settings.container.initialize();

	//Bail if a database is not set
	if(!app._database) {
		throw new Error("App does not have a database assigned to it!");
	}

	//Set stuff up
	app.setControllers(settings.controllers);
	settings.routers.forEach(r => app.addRouter(r));

	return app;
};

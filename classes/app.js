const express = require("express"),
	  fs = require("fs"),
	  path = require("path"),
	  requireAll = require("require-all");

module.exports = function createServer() {
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
			resolve: (Controller) => new Controller()
		});
	};

	app.addRouter = (fn) => {
		let router = fn(app._controllers, app._database.models);
		app.use(router._router);
	};

	return app;
};
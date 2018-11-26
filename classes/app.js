const express = require("express"),
	  fs = require("fs"),
	  path = require("path");

module.exports = function createServer() {
	let app = express();
	app._controllers = {};

	app.setDatabase = (db) => {
		app._database = db;
	};

	app.setControllers = (dir) => {
		let files = fs.readdirSync(dir);
		files.forEach(f => {
			if(!f.endsWith("Controller.js")) return;
			let Controller = require(path.join(dir, f));
			app._controllers[path.basename(f, ".js")] = new Controller();
		});
	};

	app.addRouter = (fn) => {
		let router = fn(app._controllers, app._database.models);
		app.use(router.router);
	};

	return app;
};
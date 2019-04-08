const express = require("express"),
	  RouteGroup = require("./routeGroup");

module.exports = class Router {
	constructor() {
		this.root = new RouteGroup("/");
	}

	register() {
		//Create and register routes to the base router
		let router = express.Router();
		this.root._register(router);
		return router;
	}
};
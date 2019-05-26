const express = require("express"),
	  Route = require("./route");

module.exports = class RouteGroup {
	constructor(url, fn, parent) {
		this.url = url;
		this.fn = fn;
		this.parent = parent;
		this.children = [];
		this.routes = [];
	}

	group(url, fn) {
		let group = new RouteGroup(url, fn, this);
		fn(group);
		this.children.push(group);
		return group;
	}

	_addRoute(method, path, fn) {
		let route = new Route(method, path, fn);
		this.routes.push(route);
		return route;
	}

	_register(root) {
		//Create a new sub-router to represent this route group
		let router = express.Router();

		//Recursively mount each child group assigned to sub-router
		this.children.forEach(child => child._register(router));

		//Register actual routes to the sub-router
		this.routes.forEach(route => route._register(router));

		//Apply the sub-router to the main router
		let r = root || self;
		r.use(this.url, router);
		return r;
	}


	/*---------------------------------------------------------------------------
		Defining methods
	---------------------------------------------------------------------------*/
	get(path, fn) {
		return this._addRoute("get", path, fn);
	}

	post(path, fn) {
		return this._addRoute("post", path, fn);
	}

	put(path, fn) {
		return this._addRoute("put", path, fn);
	}

	patch(path, fn) {
		return this._addRoute("patch", path, fn);
	}

	delete(path, fn) {
		return this._addRoute("delete", path, fn);
	}
};
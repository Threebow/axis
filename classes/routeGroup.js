const express = require("express"),
	  Route = require("./route"),
	  MiddlewareGroup = require("./middlewareGroup"),
	  util = require("../util"),
	  pathToRegexp = require("path-to-regexp");

module.exports = class RouteGroup {
	constructor(url, fn, parent) {
		url = util.FormatPathName(url);

		this.url = url;
		this.fn = fn;
		this.parent = parent;
		this.children = [];
		this.routes = [];
		this.middlewareNames = [];
		this._prefix = "";
		this.routeNameCache = new Map();
	}

	prefix(prefix) {
		this._prefix = prefix;
		return this;
	}

	group(url, fn) {
		let group = new RouteGroup(url, fn, this);
		fn(group);
		this.children.push(group);
		return group;
	}

	/*---------------------------------------------------------------------------
		Applies middleware to each of the routes in the group
	---------------------------------------------------------------------------*/
	middleware(...names) {
		this.middlewareNames = names;
		return this;
	}

	_addRoute(method, path, fn) {
		//Create the new route and push it to this group's stack
		let route = new Route(method, path, fn);
		this.routes.push(route);

		//Clear the route name cache, forcing a rebuild on the next use
		this.routeNameCache.clear();

		return route;
	}

	_register(root) {
		//Create a new sub-router to represent this route group
		let router = express.Router();
		router.app = this.app;

		//Apply group middleware
		let mwStack = MiddlewareGroup.getStack(this.app, this.middlewareNames);
		mwStack.filter(s => !s.delayed).forEach(fn => router.use(fn));

		//Recursively mount each child group assigned to sub-router
		this.children.forEach(child => {
			child.app = this.app;
			child._register(router);
		});

		//Register actual routes to the sub-router
		this.routes.forEach(route => route._register(router));

		//Apply delayed middleware
		mwStack.filter(s => s.delayed).forEach(fn => router.use(fn));

		//Apply the sub-router to the main router
		let r = root;
		r.use(this.url, router);
		return r;
	}

	_registerHelperMiddleware(router) {
		let self = this;

		//Creating a route helper function
		router.use((req, res, next) => {
			let routeFn = (...args) => self.getNamedRoutePath(...args);

			res.route = routeFn;
			res.locals.route = routeFn;

			next();
		});

		//Dumping the route names into the request's locals
		router.use((req, res, next) => {
			if(self.routeNameCache.size < 1) {
				self.buildRouteNameCache();
			}

			let obj = {};
			self.routeNameCache.forEach((v, k) => obj[k] = v);

			res.locals.routeNameCache = obj;
			next();
		});
	}


	/*---------------------------------------------------------------------------
		Prints out the routes of this with their names
	---------------------------------------------------------------------------*/
	buildRouteNameCache(prefix = "", url = "", cache = this.routeNameCache) {
		//First add the group's prefix to the name string
		prefix += this._prefix;
		url += this.url;

		//Add each named route to the cache
		this.routes.forEach(route => {
			if(route._name) cache.set(prefix + route._name, (url + route.path).replace(/(\/)\1/gi, "/"));
		});

		//Build upon this cache for all children
		this.children.forEach(group => {
			group.buildRouteNameCache(prefix, url, cache);
		});
	}


	/*---------------------------------------------------------------------------
		Gets a route path by name
	---------------------------------------------------------------------------*/
	getNamedRoutePath(name, params) {
		//Build the route cache if the name doesn't appear to exist
		if(!this.routeNameCache.has(name)) {
			this.buildRouteNameCache();

			//If it still doesnt exist after building, that must mean that the route does not exist, so throw an error.
			if(!this.routeNameCache.has(name)) {
				throw new Error(`A route named '${name}' does not exist.`);
			}
		}

		//Return the plain path if there are no arguments
		let path = this.routeNameCache.get(name);
		if(!params) return path;

		//Compile the path with the given parameters if they are given
		let compiled = pathToRegexp.compile(path);
		return compiled(params);
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
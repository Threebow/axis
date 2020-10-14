const express = require("express"),
	  Route = require("./route"),
	  util = require("../util"),
	  pathToRegexp = require("path-to-regexp"),
	  ResourceHelper = require("./resourceHelper");

module.exports = class RouteGroup {
	constructor(path, parent) {
		this._path = util.FormatPathName(path);
		this._parent = parent;

		this._prefix = "";
		this._resourceHelpers = [];

		this._middleware = new Set();
		this._middlewareArgs = new Map();

		this._children = [];
		this._routes = [];

		this._routeCache = new Map();
		this._routeNameCache = new Map();

		//Automatically assign base middleware to the root route group
		if(!this._parent) {
			this.middleware("base");
		}
	}


	/*---------------------------------------------------------------------------
		Public methods
	---------------------------------------------------------------------------*/
	group(path, buildFn) {
		let group = new RouteGroup(path, this);
		buildFn(group);
		this._children.push(group);
		return group;
	}

	prefix(prefix) {
		this._prefix = prefix;
		return this;
	}

	middleware(name, args = {}) {
		this._middleware.add(name);
		this._middlewareArgs.set(name, args);
		return this;
	}

	resource(path, controller) {
		let r = new ResourceHelper(path, controller);
		this._resourceHelpers.push(r);
		return r;
	}


	/*---------------------------------------------------------------------------
		Internal methods
	---------------------------------------------------------------------------*/
	_addRoute(method, path, actionFn) {
		//Create the new route and push it to this group's stack
		let route = new Route(method, path, actionFn);
		this._routes.push(route);

		return route;
	}

	_mount(app) {
		this._app = app;

		if(this._parent) {
			util.MergeMiddleware(this, this._parent);
		}

		this._resourceHelpers.forEach(r => r._register(this));
		this._routes.forEach(route => route._mount(this));
		this._children.forEach(child => child._mount(this._app));

		if(!this._parent) {
			this._buildRouteCache();
			this._buildRouteNameCache();

			for(let [path, route] of this._routeCache) {
				route._root = this;
			}
		}
	}

	_buildRouteCache(prefix = "", path = "", cache = this._routeCache) {
		//First add the group's prefix to the name string
		prefix += this._prefix;
		path += this._path;

		//Add each named route to the cache
		this._routes.forEach(route => {
			route._fullPath = (path + route._path).replace(/(\/)\1/gi, "/");
			cache.set(route.fullPathWithMethod, route);

			if(route._name) route._fullName = prefix + route._name;
		});

		//Build upon this cache for all children
		this._children.forEach(group => {
			group._buildRouteCache(prefix, path, cache);
		});
	}

	_buildRouteNameCache() {
		this._routeNameCache.clear();

		this._routeCache.forEach(route => {
			if(route._fullName) {
				this._routeNameCache.set(route._fullName, {
					fullPath: route._fullPath,
					render: pathToRegexp.compile(route._fullPath)
				});
			}
		});
	}


	/*---------------------------------------------------------------------------
		Parses a route name
	---------------------------------------------------------------------------*/
	getNamedRoutePath(name, params) {
		let path = this._routeNameCache.get(name);
		if(!path) throw new Error(`A route named "${name}" does not exist.`);

		return params ? path.render(params) : path.fullPath;
	}


	/*---------------------------------------------------------------------------
		Request methods
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
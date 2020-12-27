const express          = require("express"),
	  Route            = require("./route"),
	  util             = require("../util"),
	  pathToRegexp     = require("path-to-regexp"),
	  ResourceHelper   = require("./resourceHelper"),
	  MiddlewareHolder = require("./middlewareHolder");

module.exports = class RouteGroup extends MiddlewareHolder {
	constructor(path, parent) {
		super();

		this._path = util.FormatPathName(path);
		this._parent = parent;

		this._prefix = "";
		this._resourceHelpers = [];

		this._children = [];
		this._routes = [];

		this._routeCache = new Map();
		this._routeNameCache = new Map();
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


	/*---------------------------------------------------------------------------
		Routing internals
	---------------------------------------------------------------------------*/
	_addRoute(method, path, actionFn) {
		let route = new Route(method, path, actionFn, this);
		this._routes.push(route);
		return route;
	}

	_mount(app) {
		this._app = app ?? this._parent._app;
		this._router = express.Router();

		//Merge middleware from parent route group if it exists
		if(this._parent) {
			this._mergeMiddleware(this._parent);
		}

		//Mount child route groups
		for(let i = 0; i < this._children.length; i++) {
			this._children[i]._mount();
		}

		//Mount resource helpers
		for(let i = 0; i < this._resourceHelpers.length; i++) {
			this._resourceHelpers[i]._mount();
		}

		//Mount the routes to express
		let parent = app ? app._express : this._parent._router;
		parent.use(this._path, this._router);

		//If this is the root route group, calculate the tree of all parent routes recursively and assign this one as root
		if(!this._parent) {
			this._buildRouteCache();
			this._buildRouteNameCache();

			for(let route of this._routeCache.values()) {
				route._root = this;
				route._mount();
			}
		}
	}

	_buildRouteCache(prefix = "", path = "", base = this) {
		prefix += this._prefix;
		path += this._path;

		//Recursively call for all children
		for(let i = 0; i < this._children.length; i++) {
			this._children[i]._buildRouteCache(prefix, path, base);
		}

		for(let i = 0; i < this._routes.length; i++) {
			let route = this._routes[i];

			route._fullPath = (path + route._path).replace(/(\/)\1/gi, "/");
			route._fullName = prefix + route._name;

			base._routeCache.set(route._fullPathWithMethod, route);
		}
	}

	_buildRouteNameCache() {
		for(let route of this._routeCache.values()) {
			this._routeNameCache.set(route._fullName, {
				fullPath: route._fullPath,
				render: pathToRegexp.compile(route._fullPath)
			});
		}
	}


	/*---------------------------------------------------------------------------
		Gets a route's URI by route name
	---------------------------------------------------------------------------*/
	getRouteURI(name, params) {
		let data = this._routeNameCache.get(name);
		if(!data) throw new Error(`A route named "${name}" does not exist.`);

		return params ? data.render(params) : data.fullPath;
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


	/*---------------------------------------------------------------------------
		Resource helper
	---------------------------------------------------------------------------*/
	resource(path, controller) {
		let r = new ResourceHelper(path, controller, this);
		this._resourceHelpers.push(r);
		return r;
	}
};
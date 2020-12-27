const RequestHandler   = require("./requestHandler"),
	  MiddlewareHolder = require("./middlewareHolder"),
	  util             = require("../util"),
	  _                = require("lodash");

module.exports = class Route extends MiddlewareHolder {
	constructor(method, path, actionFn, parent) {
		super();

		this._method = method;
		this._path = util.FormatPathName(path);
		this._actionFn = actionFn;
		this._parent = parent;

		this._name = "";

		this._bindings = [];

		if(!_.isFunction(this._actionFn)) {
			throw new Error("The provided route action function is not defined.");
		}
	}


	/*---------------------------------------------------------------------------
		Allows you to tie a model to a parameter in the route, giving it
		to the controller as an argument
	---------------------------------------------------------------------------*/
	bind(name, model) {
		this._bindings.push({name, model});
		return this;
	}


	/*---------------------------------------------------------------------------
		Names this route so it can be retrieved
	---------------------------------------------------------------------------*/
	name(name) {
		this._name = name;
		return this;
	}


	/*---------------------------------------------------------------------------
		Image uploading, passes to multer
	---------------------------------------------------------------------------*/
	upload(...names) {
		if(names.length < 1) {
			throw new Error("Route upload function must be passed the name(s) of one or more files to expect.");
		}

		this._uploadFileNames = new Set(names);
		return this;
	}


	/*---------------------------------------------------------------------------
		Forces this route to validate body properties based on the JSON
		schema of the provided model
	---------------------------------------------------------------------------*/
	validate(model, fields = []) {
		this._validation = {model, fields};
		return this;
	}


	/*---------------------------------------------------------------------------
		Utility getters
	---------------------------------------------------------------------------*/
	get _fullPathWithMethod() {
		return this._method + " " + this._fullPath;
	}

	get _app() {
		return this._root?._app;
	}


	/*---------------------------------------------------------------------------
		Registers this route to an Express router
	---------------------------------------------------------------------------*/
	_mount() {
		this._mergeMiddleware(this._parent);

		this._requestHandler = new RequestHandler(this);
		this._parent._router[this._method](this._path, util.WrapAsyncFunction((req, res) => this._requestHandler.handle(req, res)));
	}
};
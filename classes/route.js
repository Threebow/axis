const MiddlewareGroup = require("./middlewareGroup"),
	  util = require("../util");

module.exports = class Route {
	constructor(method, path, action) {
		path = util.FormatPathName(path);

		this.method = method;
		this.path = path;
		this.actionFn = action;
		this.bindings = [];
		this.middlewareNames = [];
		this._name = "";
	}

	/*---------------------------------------------------------------------------
		Allows you to tie a model to a parameter in the route, giving it
		to the controller as an argument
	---------------------------------------------------------------------------*/
	bind(name, model, ...relations) {
		this.bindings.push({name, model, relations});
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
		Applies middleware to this route
	---------------------------------------------------------------------------*/
	middleware(...names) {
		this.middlewareNames = names;
		return this;
	}


	/*---------------------------------------------------------------------------
		Function that is called by express, this handles wrapping
		bindings and calling the controller method internally.
	---------------------------------------------------------------------------*/
	async _action(req, res, next) {
		let bindedModels = [];

		if(Object.keys(this.bindings).length > 0) {
			for(let i = 0; i < this.bindings.length; i++) {
				let binding = this.bindings[i];
				let model = await Route._resolveBinding(req, binding);
				//TODO: return 404 if model isn't there
				bindedModels.push(model);
			}
		}

		//Call the controller method
		let result = this.actionFn.call(this.actionFn.controller, req, res, ...bindedModels);

		//Make sure the controller is implemented properly
		if(result) {
			if(result.then) {
				//If it returns a promise, await it and then call the response
				result.then(fn => fn(req, res, next)).catch(next);
			} else {
				//Otherwise just call it the response
				result(req, res, next);
			}
		} else {
			//Otherwise send back a 501 Not Implemented
			res.sendStatus(501);
		}
	}

	static _resolveBinding(req, {name, model, relations = []}) {
		let val = req.params[name];
		let colName = model.bindingColumnName || "id";

		let q = model.query();
		relations.forEach(b => q.eager(b));
		return q.findOne({[colName]: val});
	}


	/*---------------------------------------------------------------------------
		Wraps an async route function to allow proper error handling
	---------------------------------------------------------------------------*/
	_wrapAction() {
		let fn = (...args) => this._action(...args);

		return (req, res, next) => {
			let result = fn(req, res, next);
			if(result && result.catch) result.catch(next);
		}
	}


	/*---------------------------------------------------------------------------
		Registers this route to an Express router
	---------------------------------------------------------------------------*/
	_register(router) {
		//We do this to preserve the this arg
		router[this.method](this.path, ...MiddlewareGroup.getStack(router.app, this.middlewareNames), this._wrapAction());
	}
};
module.exports = class Route {
	constructor(method, path, action) {
		this.method = method;
		this.path = path;
		this.actionFn = action;
		this.bindings = {};
	}

	/*---------------------------------------------------------------------------
		Allows you to tie a model to a parameter in the route, giving it
		to the controller as an argument
	---------------------------------------------------------------------------*/
	bind(paramName, model) {
		this.bindings[paramName] = model;
	}


	/*---------------------------------------------------------------------------
		Function that is called by express, this handles wrapping
		bindings and calling the controller method internally.
	---------------------------------------------------------------------------*/
	async _action(req, res, next) {
		let result = this.actionFn.call(this.actionFn.controller);
		if(result && result.then) {
			result.then(fn => {
				fn(req, res, next);
			});
		}
	}


	/*---------------------------------------------------------------------------
		Registers this route to an Express router
	---------------------------------------------------------------------------*/
	_register(router) {
		//We do this to preserve the this arg
		router[this.method](this.path, (...args) => this._action(...args));
	}
};
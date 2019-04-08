module.exports = class Route {
	constructor(method, path, action) {
		this.method = method;
		this.path = path;
		this.actionFn = action;
		this.bindings = [];
	}

	/*---------------------------------------------------------------------------
		Allows you to tie a model to a parameter in the route, giving it
		to the controller as an argument
	---------------------------------------------------------------------------*/
	bind(name, model) {
		this.bindings.push({name, model});
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

		let result = this.actionFn.apply(this.actionFn.controller, bindedModels);
		if(result && result.then) {
			result.then(fn => {
				fn(req, res, next);
			});
		}
	}

	static async _resolveBinding(req, {name, model}) {
		let val = req.params[name];
		let colName = model.bindingColumnName || "id";

		return await model.query().findOne({[colName]: val});
	}


	/*---------------------------------------------------------------------------
		Registers this route to an Express router
	---------------------------------------------------------------------------*/
	_register(router) {
		//We do this to preserve the this arg
		router[this.method](this.path, (...args) => this._action(...args));
	}
};
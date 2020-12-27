const _ = require("lodash");

module.exports = class RequestHandler {
	constructor(route) {
		this._route = route;
	}

	async _resolveBindings(req) {
		let ret = [];

		for(let i = 0; i < this._route._bindings.length; i++) {
			let binding = this._route._bindings[i];

			let id = req.params[binding.name];

			let found = await binding.model.query()
				.findById(_.isUndefined(id) ? null : id)
				.throwIfNotFound();

			ret.push(found);
		}

		return ret;
	}

	async _validate(req) {
		if(!this._route._validation) return;

		let {model, fields} = this._route._validation;

		let obj = {};

		for(let i = 0; i < fields.length; i++) {
			let key = fields[i];
			if(key.includes(":")) {
				let [input, mapping] = key.split(":");
				obj[mapping] = req.body[input];
			} else {
				obj[key] = req.body[key];
			}
		}

		for(let i in obj) {
			if(!obj.hasOwnProperty(i)) continue;

			if(_.isUndefined(obj[i])) {
				delete obj[i];
			}
		}

		//Trigger validation
		model.fromJson(obj);
	}

	async _runMiddleware(req, res) {
		for(let i = 0; i < this._route._middlewareNames.length; i++) {
			let {name, args} = this._route._getMiddleware(i);
			let group = this._route._app._middleware.get(name);

			let success = await group.run(req, res, args);
			if(!success) return false;
		}

		return true;
	}

	async handle(req, res) {
		req.handler = this;

		//Resolve route model bindings
		req.bindings = await this._resolveBindings(req);

		//Validate with custom model validator
		await this._validate(req);

		//Run middleware
		let success = await this._runMiddleware(req, res);
		if(!success) return;

		//Run the request handler
		let controller = this._route._actionFn._controller;
		let result = this._route._actionFn.call(controller, req, res, ...req.bindings);
		let resolved = await Promise.resolve(result);

		//Throw an error in case there is no real response
		if(_.isUndefined(resolved)) {
			//TODO: proper http unimplemented error
			throw new Error(`The "${controller.constructor.name}#${this._route._actionFn.name}" method is not implemented.`);
		}

		await controller._respond(resolved, req, res);
	}
};
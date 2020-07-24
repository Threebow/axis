const MiddlewareGroup = require("./middlewareGroup"),
	  util = require("../util"),
	  _ = require("lodash"),
	  Redirector = require("./redirector"),
	  Renderer = require("./renderer");

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
		Image uploading, passes to multer
	---------------------------------------------------------------------------*/
	uploadSingle(name = "image") {
		this.upload = {type: "SINGLE", name};
		return this;
	}

	uploadArray(name, maxCount) {
		this.upload = {type: "ARRAY", name, maxCount};
		return this;
	}

	uploadFields(fields) {
		this.upload = {type: "FIELDS", fields};
		return this;
	}


	/*---------------------------------------------------------------------------
		Forces this route to validate body properties based on the JSON
		schema of the provided model
	---------------------------------------------------------------------------*/
	validate(model, fields = []) {
		this.validation = {model, fields};
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

		//Validation
		if(this.validation) {
			let {model, fields} = this.validation;

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

				if(typeof obj[i] === "undefined") {
					delete obj[i];
				}
			}

			//Trigger validation
			model.fromJson(obj);
		}

		//Call the controller method
		let result = this.actionFn.call(this.actionFn.controller, req, res, ...bindedModels);

		if(result && result.then) {
			//If it returns a promise, await it and then respond
			result
				.then(r => this._respond(r, req, res, next))
				.catch(next);
		} else {
			//Otherwise, just respond
			this._respond(result, req, res, next);
		}
	}

	_respond(r, req, res, next) {
		if(_.isNil(r)) {
			next(new Error(`"${this.actionFn.name}" method not implemented`));
		} else if(_.isFunction(r.execute)) {
			r.execute(req, res);
		} else if(_.isFunction(r)) {
			r(req, res, next);
		} else if(_.isInteger(r)) {
			res.sendStatus(r);
		} else {
			res.send(r);
		}
	}

	static _resolveBinding(req, {name, model, relations = []}) {
		let q = model.query();
		relations.forEach(b => q.eager(b));
		return q.findOne({
			[model.idColumn]: req.params[name]
		}).throwIfNotFound();
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
	_register(router, usesCsrf) {
		let fns = MiddlewareGroup.getStack(router.app, this.middlewareNames);

		//Add upload middleware
		if(this.upload && router.app._multer) {
			switch(this.upload.type) {
				case "SINGLE":
					fns.push(router.app._multer.single(this.upload.name));
					break;
				case "ARRAY":
					fns.push(router.app._multer.array(this.upload.name, this.upload.maxCount));
					break;
				case "FIELDS":
					fns.push(router.app._multer.fields(this.upload.fields));
					break;
			}
		}

		//Add CSRF protection middleware
		if(usesCsrf && router.app._csurf) {
			fns.push(router.app._csurf);
			fns.push((req, res, next) => {
				res.locals.csrfToken = req.csrfToken();
				next();
			});
		}

		//Register the route with all the middleware
		router[this.method](this.path, ...fns, this._wrapAction());
	}
};
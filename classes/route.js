const util = require("../util"),
	  _ = require("lodash");

module.exports = class Route {
	constructor(method, path, actionFn) {
		this._method = method.toUpperCase();
		this._path = util.FormatPathName(path);
		this._actionFn = actionFn;
		this._name = "";

		this._middleware = new Set();
		this._middlewareArgs = new Map();

		this._bindings = [];
	}

	/*---------------------------------------------------------------------------
		Allows you to tie a model to a parameter in the route, giving it
		to the controller as an argument
	---------------------------------------------------------------------------*/
	bind(name, model, relation) {
		this._bindings.push({name, model, relation});
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
	middleware(name, args = {}) {
		this._middleware.add(name);
		this._middlewareArgs.set(name, args);
		return this;
	}


	/*---------------------------------------------------------------------------
		Image uploading, passes to multer
	---------------------------------------------------------------------------*/
	uploadSingle(name = "image") {
		this._upload = {type: "SINGLE", name};
		return this;
	}

	uploadArray(name, maxCount) {
		this._upload = {type: "ARRAY", name, maxCount};
		return this;
	}

	uploadFields(fields) {
		this._upload = {type: "FIELDS", fields};
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
		Function that is called by express, this handles wrapping
		bindings and calling the controller method internally.
	---------------------------------------------------------------------------*/
	async _execute(req, res) {
		//Validation
		if(this._validation) {
			let {model, fields} = this._validation;

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
				if(_.isUndefined(obj[i])) delete obj[i];
			}

			//Trigger validation
			model.fromJson(obj);
		}

		//Call the controller method
		let result = await this._actionFn.call(this._actionFn.controller, req, res, ...req.boundModels);
		return await this._respond(result, req, res);
	}

	_respond(r, req, res) {
		if(_.isNil(r)) {
			throw new Error(`"${this._actionFn.name}" method not implemented`);
		} else if(_.isFunction(r.execute)) {
			return r.execute(req, res);
		} else if(_.isFunction(r)) {
			return util.WrapMiddleware(r, req._raw, res._raw);
		} else if(_.isInteger(r)) {
			return res.sendStatus(r);
		} else {
			return res.send(r);
		}
	}


	/*---------------------------------------------------------------------------
		Registers this route to an Express router
	---------------------------------------------------------------------------*/
	_mount(group) {
		util.MergeMiddleware(this, group);

		//Merge middleware


		// let fns = MiddlewareGroup.getStack(router.app, this.middlewareNames);

		//Add upload middleware
		// if(this.upload && router.app._multer) {
		// 	switch(this.upload.type) {
		// 		case "SINGLE":
		// 			fns.push(router.app._multer.single(this.upload.name));
		// 			break;
		// 		case "ARRAY":
		// 			fns.push(router.app._multer.array(this.upload.name, this.upload.maxCount));
		// 			break;
		// 		case "FIELDS":
		// 			fns.push(router.app._multer.fields(this.upload.fields));
		// 			break;
		// 	}
		// }

		//Add CSRF protection middleware
		// if(usesCsrf && router.app._csurf) {
		// 	fns.push(router.app._csurf);
		// 	fns.push((req, res, next) => {
		// 		res.locals.csrfToken = req.csrfToken();
		// 		next();
		// 	});
		// }

		//Register the route with all the middleware
		// router[this.method](this.path, ...fns, this._wrapAction());
	}

	get fullPathWithMethod() {
		return `${this._method} ${this._fullPath}`;
	}
};
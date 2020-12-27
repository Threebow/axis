const Middleware = require("./middleware");

module.exports = class MiddlewareGroup {
	constructor(name, middleware, app) {
		this._name = name;
		this._app = app;

		this._mountMiddleware(middleware);
	}

	_mountMiddleware(arr = []) {
		this._middleware = [];

		for(let i = 0; i < arr.length; i++) {
			let mw = arr[i];

			if(!mw || !(mw.prototype instanceof Middleware)) {
				throw new Error(`Middleware at index "${i}" passed to middleware group "${this._name}" is invalid.`);
			}

			let instance = new mw(this._app);
			this._middleware.push(instance);
		}
	}

	async run(...args) {
		if(!this._middleware) {
			throw new Error(`Middleware group "${this._name}" has not yet had middleware mounted.`);
		}

		for(let i = 0; i < this._middleware.length; i++) {
			let success = await this._middleware[i].execute(...args);
			if(!success) return false;
		}

		return true;
	}
};
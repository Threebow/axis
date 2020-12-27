const _ = require("lodash");

module.exports = class MiddlewareHolder {
	constructor() {
		this._middlewareNames = [];
		this._middlewareArgs = new Map();
	}

	/*---------------------------------------------------------------------------
		Methods accessible to routing
	---------------------------------------------------------------------------*/
	middleware(...expressions) {
		this._assignMiddleware(expressions);
	}

	prependMiddleware(...expressions) {
		this._assignMiddleware(expressions, true);
	}

	/*---------------------------------------------------------------------------
		Methods used internally
	---------------------------------------------------------------------------*/
	static _parseMiddlewareExpression(str) {
		if(!_.isString(str)) {
			throw new TypeError("Middleware expression must be a string.");
		}

		let [name, argStr] = str.split(":");
		let args = _.isString(argStr) ? argStr.split(",") : [];

		return {name, args};
	}

	_assignMiddleware(expressions, atStart = false) {
		for(let i = 0; i < expressions.length; i++) {
			let {name, args} = MiddlewareHolder._parseMiddlewareExpression(expressions[i]);

			if(atStart) {
				this._middlewareNames.unshift(name);
			} else {
				this._middlewareNames.push(name);
			}

			this._middlewareArgs.set(name, args);
		}
	}

	_mergeMiddleware(source) {
		this._middlewareNames = _.uniq([...source._middlewareNames, ...this._middlewareNames]);
		this._middlewareArgs = new Map([...source._middlewareArgs, ...this._middlewareArgs]);

		this._verifyMiddleware();
	}

	_verifyMiddleware() {
		for(let i = 0; i < this._middlewareNames.length; i++) {
			let name = this._middlewareNames[i];

			if(!this._app._middleware.has(name)) {
				throw new Error(`Trying to use non-existant middleware "${name}"`);
			}
		}
	}

	_getMiddleware(idx) {
		let name = this._middlewareNames[idx];
		let args = this._middlewareArgs.get(name);
		return {name, args};
	}
};
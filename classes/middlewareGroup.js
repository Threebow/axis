const Util = require("../util");

module.exports = class MiddlewareGroup {
	constructor(name, members) {
		this.name = name;
		this.members = members;
	}

	static _wrapMiddleware(arr) {
		let ret = [];

		for(let i = 0; i < arr.length; i++) {
			let fn = arr[i];

			if(fn.length === 4) {
				ret.push(fn);
				continue;
			}

			ret.push(Util.WrapAsyncFunction(fn));
		}

		return ret;
	}

	static getStack(app, groupNames) {
		let fns = [];

		groupNames.forEach(name => {
			let group = app.middleware[name];
			if(!group) throw new Error(`Trying to use non-existant middleware '${name}'`);
			fns.push(...group.members);
		});

		return this._wrapMiddleware(fns);
	}
};
const _ = require("lodash");

module.exports = class Middleware {
	async _exec(req, res, args) {
		if(!this.run || !_.isFunction(this.run)) throw new Error(`Middleware '${this.constructor.name}' has no run method!`);
		await this.run({req, res, args}, ...req.boundModels);
	}
};
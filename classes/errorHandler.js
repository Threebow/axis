const Responder = require("./responder"),
	  _         = require("lodash");

module.exports = class ErrorHandler extends Responder {
	async execute(err, req, res) {
		if(!_.isFunction(this.handle)) {
			throw new Error(`Error handler "${this.constructor.name}" has no handle method`);
		}

		let result = await Promise.resolve(this.handle(err, req, res));

		if(!_.isNil(result)) {
			await this._respond(result, req, res);
		}
	}

	static initFrom(ctor, app) {
		if(!(ctor?.prototype instanceof ErrorHandler)) {
			throw new Error("The provided error handler is invalid.");
		}

		return new ctor(app);
	}
};
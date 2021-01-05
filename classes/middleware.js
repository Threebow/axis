const Responder = require("./responder"),
	  _         = require("lodash");

module.exports = class Middleware extends Responder {
	async execute(req, res, args) {
		if(!_.isFunction(this.run)) {
			throw new Error(`Middleware "${this.constructor.name}" has no run method`);
		}

		let result = await Promise.resolve(this.run(req, res, ...[...args, ...(req.bindings ?? [])]));

		if(!_.isNil(result)) {
			await this._respond(result, req, res);
			return false;
		}

		return true;
	}

	static promisifyExpressMiddleware(fn) {
		return (req, res) => {
			return new Promise((resolve, reject) => {
				fn(req, res, (err) => {
					if(err) return reject(err);
					resolve();
				});
			});
		};
	}

	static fromExpressMiddleware(fn) {
		let wrapped = Middleware.promisifyExpressMiddleware(fn);

		return class extends Middleware {
			run(req, res) {
				return wrapped(req, res);
			}
		};
	}
};
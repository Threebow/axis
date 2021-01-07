const Middleware = require("../classes/middleware");

module.exports = class AuthMiddleware extends Middleware {
	constructor(...args) {
		super(...args);

		if(this.Auth) {
			this._initialize = Middleware.promisifyExpressMiddleware(this.Auth.initialize());
			this._session = Middleware.promisifyExpressMiddleware(this.Auth.session());
		}
	}

	async run(req, res) {
		if(this._initialize && this._session) {
			await this._initialize(req, res);
			await this._session(req, res);
		}
	}
};
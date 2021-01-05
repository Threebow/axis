const Middleware = require("../classes/middleware"),
	  csurf      = require("csurf");

module.exports = class CSRFMiddleware extends Middleware {
	constructor(...args) {
		super(...args);

		if(this._app._expressOptions.csrf) {
			this._csurf = Middleware.promisifyExpressMiddleware(csurf());
		}
	}

	async run(req, res) {
		if(this._csurf) {
			await this._csurf(req, res);
			res.locals.csrfToken = req.csrfToken();
		}
	}
};
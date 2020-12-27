const Middleware = require("../classes/middleware"),
	  csurf      = require("csurf");

module.exports = class CSRFMiddleware extends Middleware {
	constructor(...args) {
		super(...args);
		this._csurf = Middleware.promisifyExpressMiddleware(csurf());
	}

	async run(req, res) {
		await this._csurf(req, res);
		res.locals.csrfToken = req.csrfToken();
	}
};
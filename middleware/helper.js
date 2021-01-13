const path = require("path");

module.exports = class HelperMiddleware extends require("../classes/middleware") {
	constructor(...args) {
		super(...args);

		if(this._app._expressOptions.staticContentRoot) {
			try {
				this._mixManifest = require(path.join(this._app._expressOptions.staticContentRoot, "./mix-manifest.json"));
			} catch(e) {
				if(e.code === "MODULE_NOT_FOUND") {
					this._mixManifest = {};
				} else throw e;
			}
		}
	}

	run(req, res) {
		//Set real IP address
		req.realIp = req.get("CF-Connecting-IP") ?? req.ip;

		//Determine response type
		let wantsHtml = req.accepts("html") !== false;
		let wantsJson = req.accepts("json") !== false;
		req.wantsJsonResponse = wantsJson && !wantsHtml;

		//Store user in locals
		res.locals.user = req.user;

		//Frontend asset delivery
		res.locals.asset = (s) => this._mixManifest[s] ?? s;
	}
};
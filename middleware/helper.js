module.exports = class HelperMiddleware extends require("../classes/middleware") {
	run(req) {
		//Set real IP address
		req.realIp = req.get("CF-Connecting-IP") ?? req.ip;

		//Determine response type
		let wantsHtml = req.accepts("html") !== false;
		let wantsJson = req.accepts("json") !== false;
		req.wantsJsonResponse = wantsJson && !wantsHtml;
	}
};
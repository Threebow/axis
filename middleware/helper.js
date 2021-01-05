module.exports = class HelperMiddleware extends require("../classes/middleware") {
	run(req) {
		req.realIp = req.get("CF-Connecting-IP") ?? req.ip;

		let wantsHtml = req.accepts("html") !== false;
		let wantsJson = req.accepts("json") !== false;

		req.wantsJsonResponse = wantsJson && !wantsHtml;
	}
};
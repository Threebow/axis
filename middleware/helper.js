module.exports = class HelperMiddleware extends require("../classes/middleware") {
	run(req) {
		let wantsHtml = req.accepts("html") !== false;
		let wantsJson = req.accepts("json") !== false;

		req.wantsJsonResponse = wantsJson && !wantsHtml;
	}
};
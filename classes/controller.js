const Responder = require("./responder");

module.exports = class Controller extends Responder {
	async destroy(req, res, model) {
		await model.$query().delete();
		return 204;
	}
};
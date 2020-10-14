const Middleware = require("../classes/middleware");

module.exports = class RouteHelper extends Middleware {
	async run({req, res}) {
		res.locals.route = req.route.bind(req);
	}
}
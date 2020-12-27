module.exports = class RoutingMiddleware extends require("../classes/middleware") {
	run(req, res) {
		let root = req.handler._route._root;

		//Add route function
		let routeFn = (...args) => root.getRouteURI(...args);
		res.route = routeFn;
		res.locals.route = routeFn;

		//TODO: rework somehow
		res.locals.routeNameCache = root._routeNameCache;
	}
};
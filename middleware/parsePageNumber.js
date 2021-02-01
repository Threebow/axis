module.exports = class ParsePageNumberMiddleware extends require("../classes/middleware") {
	run(req, res) {
		if(req.query.page) {
			let int = parseInt(req.query.page);
			req.query.page = isNaN(int) ? 0 : Math.max(0, int - 1);
		} else {
			req.query.page = 0;
		}

		res.locals.pageNumber = req.query.page;
	}
};
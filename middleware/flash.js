const Middleware = require("../classes/middleware"),
	  flash      = require("express-flash");

module.exports = Middleware.fromExpressMiddleware(flash());
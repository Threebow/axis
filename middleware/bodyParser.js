const Middleware = require("../classes/middleware"),
	  util = require("../util"),
	  bodyParser = require("body-parser");

module.exports = class BodyParser extends Middleware {
	constructor(limit = "8mb") {
		super();

		this.urlEncoded = bodyParser.urlencoded({extended: true, limit});
		this.json = bodyParser.json();
	}

	async run({req, res}) {
		try {
			await util.WrapMiddleware(this.urlEncoded, req._raw, res._raw);
			await util.WrapMiddleware(this.json, req._raw, res._raw);
		} catch(e) {
			return await res.send(400);
		}
	}
}
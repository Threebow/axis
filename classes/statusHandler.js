const createError = require("http-errors");

module.exports = class StatusHandler extends require("./flasher") {
	constructor(code) {
		super();
		this.code = code;
	}

	send(data) {
		this.data = data;
		return this;
	}

	execute(req, res) {
		//Apply flash messages
		this.flash(req);

		//Create an HTTP error for error codes
		if(this.code >= 400 && this.code < 600) {
			throw createError(this.code, this.data ?? undefined);
		}

		//Send status code back
		if(this.data) {
			res.status(this.code).send(this.data);
		} else {
			res.sendStatus(this.code);
		}
	}
};
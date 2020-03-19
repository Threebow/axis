module.exports = class StatusHandler extends require("./flasher") {
	constructor(code) {
		super();
		this.code = code;
	}

	execute(req, res) {
		//Apply flash messages
		this.flash(req);

		//Send the HTTP status
		res.sendStatus(this.code);
	}
};
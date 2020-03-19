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

		//Send the HTTP status
		if(this.data) {
			res.status(this.code).send(this.data);
		} else {
			res.sendStatus(this.code);
		}
	}
};
const Redirector = require("./redirector"),
	  Renderer = require("./renderer"),
	  StatusHandler = require("./statusHandler");

module.exports = class Controller {
	constructor(app) {
		this.models = app._database.models;
	}

	render(view, data = {}) {
		return new Renderer(view, data);
	}

	status(code) {
		return new StatusHandler(code);
	}

	send(data) {
		return new StatusHandler(200)
			.send(data);
	}

	get redirect() {
		return new Redirector();
	}
};
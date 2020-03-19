const Redirector = require("./redirector"),
	  Renderer = require("./renderer");

module.exports = class Controller {
	constructor(app) {
		this.models = app._database.models;
	}

	render(view, data = {}) {
		return new Renderer(view, data);
	}

	get redirect() {
		return new Redirector();
	}
};
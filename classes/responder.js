const ContainerProxy = require("./containerProxy"),
	  StatusHandler  = require("./statusHandler"),
	  Redirector     = require("./redirector"),
	  Renderer       = require("./renderer"),
	  _              = require("lodash");

module.exports = class Responder extends ContainerProxy {
	constructor(app) {
		super(app._container);
		this._app = app;
	}

	//Response helpers
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

	//Handling what's returned from any of the above response helpers
	async _respond(r, req, res) {
		if(_.isFunction(r?.execute)) {
			await Promise.resolve(r.execute(req, res));
		} else if(_.isInteger(r)) {
			return await this._respond(new StatusHandler(r), req, res);
		} else {
			res.send(r);
		}
	}

	get models() {
		return this._app._container.database?.models;
	}
};
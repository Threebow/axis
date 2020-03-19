const Redirector = require("./redirector");

module.exports = class Controller {
	constructor(app) {
		this.models = app._database.models;
	}

	render(view, data = {}) {
		return (req, res) => {
			res.locals.AppViewData = {...data, ...res.locals};
			return res.render(view, data);
		}
	}

	get redirect() {
		return new Redirector();
	}
};
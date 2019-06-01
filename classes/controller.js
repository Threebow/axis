module.exports = class Controller {
	constructor(app) {
		this.models = app._database.models;
	}

	render(...args) {
		return (req, res) => res.render(...args);
	}

	redirect(route) {
		return (req, res) => res.redirect(route);
	}
};
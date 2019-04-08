module.exports = class Controller {
	constructor(app) {
		this.models = app._database.models;
	}

	render(view) {
		return (req, res) => res.render(view);
	}
};
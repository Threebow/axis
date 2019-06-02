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

	redirect(route) {
		return (req, res) => res.redirect(route);
	}
};
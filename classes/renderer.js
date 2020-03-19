module.exports = class Renderer extends require("./flasher") {
	constructor(view, data = {}) {
		super();
		this.view = view;
		this.data = data;
	}

	execute(req, res) {
		//Apply flash messages
		this.flash(req);

		//Inject locals into the view
		res.locals.AppViewData = {...this.data, ...res.locals};

		//Redirect
		res.render(this.view, this.data);
	}
};
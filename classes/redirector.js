module.exports = class Redirector extends require("./flasher") {
	constructor() {
		super();
	}

	to(routeName, data) {
		this.route = routeName;
		this.routeData = data;
		this.setup = true;

		return this;
	}

	back() {
		this.sendBack = true;
		this.setup = true;

		return this;
	}

	execute(req, res) {
		//Make sure this works
		if(!this.setup)
			throw new Error("Nowhere to redirect");

		//Apply flash messages
		this.flash(req);

		//Redirect
		res.redirect(this.sendBack ? "back" : res.route(this.route, this.routeData));
	}
};
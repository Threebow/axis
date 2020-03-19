module.exports = class Redirector extends require("./flasher") {
	constructor() {
		super();
		this.hashStr = "";
	}

	to(routeName, data) {
		this.route = routeName;
		this.routeData = data;
		this.setup = true;

		return this;
	}

	toURL(url) {
		this.url = url;
		this.setup = true;

		return this;
	}

	back() {
		this.sendBack = true;
		this.setup = true;

		return this;
	}

	hash(str) {
		this.hashStr = `#${str}`;
		return this;
	}

	execute(req, res) {
		//Make sure this works
		if(!this.setup)
			throw new Error("Nowhere to redirect");

		//Apply flash messages
		this.flash(req);

		//Redirect
		if(this.sendBack) {
			res.redirect("back");
		} else if(this.url) {
			res.redirect(this.url);
		} else {
			res.redirect(res.route(this.route, this.routeData) + this.hashStr);
		}
	}
};
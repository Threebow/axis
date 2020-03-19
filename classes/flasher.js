module.exports = class Flasher {
	constructor() {
		this.flashMessages = [];
	}

	with(type, str) {
		this.flashMessages.push({type, str});
		return this;
	}

	withSuccess(str) {
		return this.with("success", str);
	}

	withError(str) {
		return this.with("error", str);
	}

	flash(req) {
		this.flashMessages.forEach(f => req.flash(f.type, f.str));
	}
};
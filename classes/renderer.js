module.exports = class Renderer extends require("./flasher") {
	constructor(view, data) {
		super();

		this.view = view;
		this.data = data;
	}

	async execute(req, res) {
		this.flash(req);
		await res.render(this.view, this.data);
	}
};
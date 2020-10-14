const fs = require("fs"),
	  path = require("path"),
	  util = require("util");

let readFile = util.promisify(fs.readFile);

module.exports = class ViewEngine {
	constructor(app, opts = {}) {
		this._app = app;
		this.extension = opts.extension;

		this.cache = new Map();
	}

	formatViewName(view) {
		if(!this.extension) return view;
		return view.endsWith(this.extension) ? view : (view + this.extension);
	}

	async render(view, data) {
		let fullPath = path.join(this._app.settings.baseViewDirectory, this.formatViewName(view));
		console.log(`RENDERING ${view}:`, data);
		return (await this._getCompiler(fullPath))(data);
	}

	async _getCompiler(view) {
		let existing = this.cache.get(view);
		if(existing) return existing;

		let str = await readFile(view, "utf-8");

		let compiler = this.compile(str);
		this.cache.set(view, compiler);

		return compiler;
	}
}
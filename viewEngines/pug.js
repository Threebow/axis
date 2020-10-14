const ViewEngine = require("../classes/viewEngine"),
	  pug = require("pug");

module.exports = class PugViewEngine extends ViewEngine {
	constructor(app) {
		super(app, {
			extension: ".pug"
		});
	}

	compile(content) {
		return pug.compile(content, {
			basedir: this._app.settings.baseViewDirectory
		});
	}
}
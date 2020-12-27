const Knex = require("knex"),
	  path = require("path"),
	  fs   = require("fs");

module.exports = class Database {
	constructor(options) {
		this._knex = new Knex(options.knexOptions);
		this._loadModels(options.modelPath);
	}

	_loadModels(dir) {
		this.models = {};

		let files = fs.readdirSync(dir);

		for(let i = 0; i < files.length; i++) {
			let file = files[i];
			if(!file.endsWith(".js")) continue;

			let model = require(path.join(dir, file));
			model.knex(this._knex);
			this.models[model.name] = model;
		}
	}
};
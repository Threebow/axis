const Knex = require("knex"),
	  path = require("path"),
	  fs = require("fs");

class Database {
	constructor({options, models}) {
		this.knex = new Knex(options);
		this.loadModels(models);
	}

	loadModels(dir) {
		this.models = {};

		let files = fs.readdirSync(dir);
		files.forEach(f => {
			if(!f.endsWith(".js")) return;
			let model = require(path.join(dir, f));
			model.knex(this.knex);
			this.models[model.name] = model;
		});
	}
}

//Pagination helper
/*Database.Model.paginate = async function(pageNum, max, options) {
	let page = Math.max(1, Math.floor(Number(pageNum) || 1));
	let offset = (page-1)*max;

	options = options || {};
	options.limit = max;
	options.offset = offset;

	let {rows, count} = await this.findAndCountAll(options);

	let totalPages = Math.ceil(count/max);
	return {rows, totalPages, perPage: max, currentPage: page}
};*/

module.exports = Database;
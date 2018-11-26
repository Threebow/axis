const Sequelize = require("sequelize"),
	  path = require("path"),
	  fs = require("fs");

class Database extends Sequelize {
	constructor() {
		super(...arguments);
	}

	loadModels(dir) {
		let files = fs.readdirSync(dir);
		files.forEach(f => {
			if(!f.endsWith(".js")) return;
			this.import(path.join(dir, f));
		});

		Object.keys(this.models).forEach(name => {
			if(this.models[name].associate) {
				this.models[name].associate(this.models);
			}
		});
	}
}

//Pagination helper
Database.Model.paginate = async function(pageNum, max, options) {
	let page = Math.max(1, Math.floor(Number(pageNum) || 1));
	let offset = (page-1)*max;

	options = options || {};
	options.limit = max;
	options.offset = offset;

	let {rows, count} = await this.findAndCountAll(options);

	let totalPages = Math.ceil(count/max);
	return {rows, totalPages, perPage: max, currentPage: page}
};

module.exports = Database;
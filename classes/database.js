const ContainerProxy = require("./containerProxy"),
	  BaseModel      = require("./baseModel"),
	  Knex           = require("knex"),
	  path           = require("path"),
	  fs             = require("fs-extra"),
	  _              = require("lodash");

module.exports = class Database {
	constructor(app, options) {
		this._app = app;
		this._options = options;
	}

	async initialize() {
		//Instantiate knex
		this._knex = new Knex(this._options.knexOptions);

		//Ensure that the connection is valid
		try {
			await this._knex.raw("SELECT 1 + 1");
		} catch(e) {
			console.error("Database connection error: " + e.message);
			process.exit(1);
			return;
		}

		//Load all of the models
		this.models = await this._loadModels();
	}

	async _loadModels() {
		let models = {};

		let proxy = new ContainerProxy(this._app._container);

		(await fs.readdir(this._options.modelPath))
			.filter(f => f.endsWith("js")) //Filter to JavaScript files only
			.map(f => path.join(this._options.modelPath, f)) //Map to the absolute path
			.map(f => require(f)) //Require each model
			.filter(fn => _.isFunction(fn)) //Filter out non-functions
			.map(fn => (fn.prototype instanceof BaseModel) ? fn : fn(this._app, proxy, this.modelProxy)) //Transform the model class
			.forEach(m => {
				m.knex(this._knex); //Initialize knex
				models[m.name] = m;
			});

		return models;
	}

	get modelProxy() {
		if(this._modelProxy) return this._modelProxy;

		this._modelProxy = new Proxy({}, {
			get: (target, prop) => {
				return this.models[prop];
			}
		});

		return this._modelProxy;
	}
};
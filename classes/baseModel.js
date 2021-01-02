const objection = require("objection"),
	  ajvErrors = require("ajv-errors"),
	  moment    = require("moment"),
	  _         = require("lodash");

const DATABASE_TIMESTAMP_FORMAT = "YYYY-MM-DD HH:mm:ss";


/*---------------------------------------------------------------------------
	Custom query builder
---------------------------------------------------------------------------*/
class CustomQueryBuilder extends objection.QueryBuilder {
	search(term, columns = []) {
		if(!term) return this;

		let search = term.trim().toLowerCase();
		this.where(builder => {
			columns.forEach(c => {
				builder.orWhere(c, "like", `%${search}%`);
			});
		});

		return this;
	}

	newest() {
		return this.orderBy(this.modelClass().timestampColumns.created, "DESC");
	}

	oldest() {
		return this.orderBy(this.modelClass().timestampColumns.created, "ASC");
	}

	sorted() {
		return this.orderBy("sort_order");
	}

	dontExclude(...fields) {
		return this.modify("dontExclude", fields);
	}
}


/*---------------------------------------------------------------------------
	Base model
---------------------------------------------------------------------------*/
module.exports = class BaseModel extends objection.Model {
	static get QueryBuilder() {
		return CustomQueryBuilder;
	}

	static createValidator() {
		return new objection.AjvValidator({
			onCreateAjv: (ajv) => this.onCreateAjv(ajv),
			options: this.ajvOptions
		});
	}

	static onCreateAjv(ajv) {
		return ajvErrors(ajv, {
			singleError: false
		});
	}

	static get ajvOptions() {
		return {
			allErrors: true,
			jsonPointers: true,
			validateSchema: false,
			ownProperties: true,
			v5: true
		};
	}

	static get timestamps() {
		return false;
	}

	static get timestampColumns() {
		return {
			created: "created_at",
			updated: "updated_at"
		};
	}

	static get excludedFields() {
		return [];
	}

	async $beforeUpdate(opts, ctx) {
		await super.$beforeUpdate(opts, ctx);

		if(this.constructor.timestamps && this.constructor.timestampColumns.updated) {
			this[this.constructor.timestampColumns.updated] = (new Date()).toISOString();
		}

		await this.checkUnique(opts.old);
	}

	async $beforeInsert(ctx) {
		await super.$beforeInsert(ctx);

		if(this.constructor.timestamps) {
			let now = (new Date()).toISOString();

			if(this.constructor.timestampColumns.created) {
				this[this.constructor.timestampColumns.created] = now;
			}

			if(this.constructor.timestampColumns.updated) {
				this[this.constructor.timestampColumns.updated] = now;
			}
		}

		await this.checkUnique();
	}

	async checkUnique(old = {}) {
		let props = this.constructor.jsonSchema.properties;

		for(let i in props) {
			if(props[i].unique && this[i]) {
				if(old[i] && old[i] === this[i]) continue;

				let instance = await this.constructor.query()
					.where({[i]: this[i]})
					.first();

				if(instance) {
					throw new objection.ValidationError({
						message: `${i}: is already in use`,
						type: "ModelValidation",
						data: {
							[i]: [
								{
									message: "is already in use",
									keyword: "unique",
									params: {
										unique: true
									}
								}
							]
						}
					});
				}
			}
		}
	}

	$beforeValidate(schema, json, opt) {
		schema = super.$beforeValidate(schema, json, opt);

		if(this.constructor.timestamps) {
			for(let i in this.constructor.timestampColumns) {
				let name = this.constructor.timestampColumns[i];
				schema.properties[name] = {type: "string", format: "date-time"};
			}
		}

		return schema;
	}

	//Convert boolean fields from integer form to boolean form
	$parseDatabaseJson(json) {
		json = super.$parseDatabaseJson(json);

		//TODO: make work for array types e.g. ["boolean", "null"]
		let props = this.constructor.jsonSchema.properties;
		for(let i in props) {
			let val = json[i];
			if(props[i].type === "boolean" && _.isInteger(val)) {
				json[i] = Boolean(val);
			}
		}

		return json;
	}

	//Convert ISO timestamps to the MySQL TIMESTAMP format
	$formatDatabaseJson(json) {
		json = super.$formatDatabaseJson(json);

		let schema = this.$beforeValidate(this.constructor.jsonSchema, json, {});

		for(let i in json) {
			if(schema.properties[i]?.format === "date-time") {
				let time = moment(json[i]);

				if(time.isValid()) {
					json[i] = time.format(DATABASE_TIMESTAMP_FORMAT);
				}
			}
		}

		return json;
	}

	//Convert date objects to their ISO equivalents
	$parseJson(json, opt) {
		json = super.$parseJson(json, opt);

		for(let i in json) {
			if(!json.hasOwnProperty(i)) continue;

			let prop = json[i];
			if(prop && typeof prop?.toISOString === "function") {
				json[i] = prop.toISOString();
			}
		}

		return json;
	}

	$afterGet(ctx) {
		//Field exclusion
		this.constructor.excludedFields.forEach(name => {
			if(!ctx.dontExclude || !ctx.dontExclude.includes(name)) {
				delete this[name];
			}
		});

		return super.$afterGet(ctx);
	}

	fixTimestamps() {
		let schema = this.$beforeValidate(this.constructor.jsonSchema, {}, {});

		for(let i in schema.properties) {
			let prop = schema.properties[i];

			if(_.isString(this[i]) && prop.format === "date-time") {
				this[i] = new Date(this[i]);
			}
		}
	}

	async $afterUpdate(opts, ctx) {
		this.fixTimestamps();
		return super.$afterUpdate(opts, ctx);
	}

	$afterInsert(ctx) {
		this.fixTimestamps();
		return super.$afterInsert(ctx);
	}

	static get modifiers() {
		return {
			newest: (builder) => {
				builder.newest();
			},
			oldest: (builder) => {
				builder.oldest();
			},
			sorted: (builder) => {
				builder.sorted();
			},
			dontExclude: (builder, fields = []) => {
				builder.context({
					dontExclude: fields
				});
			}
		};
	}

	static async updateOrder(ids) {
		for(let i = 0; i < ids.length; i++) {
			await this.query()
				.findById(ids[i])
				.patch({sort_order: i + 1});
		}
	}
};
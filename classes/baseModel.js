const {Model, QueryBuilder, AjvValidator, ValidationError} = require("objection"),
	  moment = require("moment"),
	  ajvErrors = require("ajv-errors");

/*---------------------------------------------------------------------------
	Custom query builder
---------------------------------------------------------------------------*/
class CustomQueryBuilder extends QueryBuilder {
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
module.exports = class BaseModel extends Model {
	static get QueryBuilder() {
		return CustomQueryBuilder;
	}

	static createValidator() {
		return new AjvValidator({
			onCreateAjv: (ajv) => {
				return this.onCreateAjv(ajv);
			},
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
		}
	}

	static get timestamps() {
		return false;
	}

	static get timestampColumns() {
		return {
			created: "created_at",
			updated: "updated_at"
		}
	}

	static get excludedFields() {
		return [];
	}

	async $beforeUpdate(opts, ctx) {
		await super.$beforeUpdate(opts, ctx);

		if(this.constructor.timestamps && this.constructor.timestampColumns.updated) {
			this[this.constructor.timestampColumns.updated] = moment().format(process.env.DATETIME_FORMAT);
		}

		await this.checkUnique(opts.old);
	}

	async $beforeInsert(ctx) {
		await super.$beforeInsert(ctx);

		if(this.constructor.timestamps) {
			let now = moment().format(process.env.DATETIME_FORMAT);

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
					throw new ValidationError({
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

	$afterGet(ctx) {
		//Automatically convert booleans fields from ints to actual booleans
		let props = this.constructor.jsonSchema.properties;
		for(let i in props) {
			if(props[i].type === "boolean") {
				this[i] = Boolean(this[i]);
			}
		}

		//Exclude certain fields
		this.constructor.excludedFields.forEach(name => {
			if(!ctx.dontExclude || !ctx.dontExclude.includes(name)) {
				delete this[name];
			}
		});

		return super.$afterGet(ctx);
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
		}
	}
};
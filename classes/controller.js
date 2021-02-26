const RequestValidationError = require("../errors/requestValidationError"),
	  addFormats             = require("ajv-formats"),
	  Responder              = require("./responder"),
	  Ajv                    = require("ajv").default;

module.exports = class Controller extends Responder {
	constructor(app) {
		super(app);

		this._validator = new Ajv({useDefaults: true, allErrors: true, $data: true});
		addFormats(this._validator);
	}

	validate(obj, properties, extra = {}) {
		//If an array of property names is passed, we just want to make sure they are defined (without any additional validation rules)
		if(Array.isArray(properties)) {
			let temp = {};
			properties.forEach(p => temp[p] = {});
			properties = temp;
		}

		//Parse existing values into the correct formats if necessary
		for(let i in properties) {
			let def = properties[i];

			let val = obj[i];
			if(val == null) continue;

			switch(def.type) {
				case "boolean":
					if(["1", 1, "on"].includes(val)) obj[i] = true;
					if(["0", 0, "off"].includes(val)) obj[i] = false;
					break;

				case "integer":
					let int = parseInt(val);
					if(!isNaN(int)) obj[i] = int;
					break;

				case "number":
					let float = parseFloat(val);
					if(!isNaN(float)) obj[i] = float;
			}
		}

		//Create the main schema
		let schema = {
			type: "object",
			required: Object.keys(properties),
			properties,
			...extra
		};

		//Run the validator
		let fn = this._validator.compile(schema);
		if(!fn(obj)) {
			throw new RequestValidationError(fn.errors);
		}
	}
};
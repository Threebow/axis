const _ = require("lodash");

const REQUIRED_FUNCTONS = ["store", "get", "unlink", "rename"];

module.exports = class StorageDisk {
	constructor() {
		for(let i = 0; i < REQUIRED_FUNCTONS.length; i++) {
			let name = REQUIRED_FUNCTONS[i];

			if(!_.isFunction(this[name])) {
				throw new Error(`Storage disk implementation must have the "${name}" function defined.`);
			}
		}
	}
};
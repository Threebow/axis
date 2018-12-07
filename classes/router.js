const express = require("express");

module.exports = class Router {
	constructor() {
		this._router = express.Router();
	}

	get(path, fn, bindings) {
		this._router.get(path, async (req, res) => {
			let models = {};

			for(let i in bindings) {
				let model = bindings[i];
				let val = await model.findByPk(req.params[i]);
				if(!val) return res.sendStatus(404);
				models[i] = val;
			}

			res.send(models);
		});
	}
};
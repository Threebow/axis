const Middleware = require("../classes/middleware");

function resolveBinding(req, {name, model, relation}) {
	let q = model.query();
	if(relation) q.withGraphFetched(relation);

	return q.findOne({
		[model.idColumn]: req.params[name]
	}).throwIfNotFound();
}

module.exports = class RouteModelBinder extends Middleware {
	async run({req, res}) {
		let bindings = req._route._bindings;
		if(Object.keys(bindings).length < 1) return;

		for(let i = 0; i < bindings.length; i++) {
			let instance = await resolveBinding(req, bindings[i]);
			req.boundModels.push(instance);
		}
	}
}
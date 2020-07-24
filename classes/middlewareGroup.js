module.exports = class MiddlewareGroup {
	constructor(name, members) {
		this.name = name;
		this.members = members;
	}

	static getStack(app, groupNames) {
		let fns = [];

		groupNames.forEach(name => {
			let group = app.middleware[name];
			if(!group) throw new Error(`Trying to use non-existant middleware '${name}'`);
			fns.push(...group.members);
		});

		return fns;
	}
};
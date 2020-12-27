const METHODS = {
	index:		{method: "get"},
	create:		{method: "get", suffix: "create"},
	store:		{method: "post"},
	show:		{method: "get", bind: true},
	edit:		{method: "get", bind: true, suffix: "edit"},
	update:		{method: "patch", bind: true},
	destroy:	{method: "delete", bind: true}
}

const METHOD_KEYS = Object.keys(METHODS);

module.exports = class ResourceHelper {
	constructor(path, controller, parent) {
		this.path = path;
		this.controller = controller;
		this.enabledMethods = METHOD_KEYS;
		this.modifiers = {};
		this._parent = parent;
	}

	only(...arr) {
		this.enabledMethods = arr;
		return this;
	}

	except(...arr) {
		this.enabledMethods = METHOD_KEYS.filter(m => !arr.includes(m));
		return this;
	}

	bind(key, model) {
		this.binding = {key, model};
		return this;
	}

	modify(name, fn) {
		this.modifiers[name] = fn;
		return this;
	}

	_mount() {
		if(!this.binding) throw new Error("Axis resource must have a model binding");

		for(let i = 0; i < this.enabledMethods.length; i++) {
			let methodName = this.enabledMethods[i];

			let def = METHODS[methodName];
			if(!def) throw new Error(`Axis resource has invalid method: '${methodName}'`);

			let routePath = (def.bind ? `${this.path}:${this.binding.key}` : this.path);
			routePath += (routePath.endsWith("/") ? "" : "/") + (def.suffix ? def.suffix : "");

			let route = this._parent[def.method](routePath, this.controller[methodName]).name(methodName);

			let modifier = this.modifiers[methodName];
			if(modifier) modifier(route);
			if(def.bind) route.bind(this.binding.key, this.binding.model);
		}
	}
};
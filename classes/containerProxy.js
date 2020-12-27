module.exports = class ContainerProxy {
	constructor(container) {
		this._container = container;

		return new Proxy(this, {
			get: (target, prop) => {
				let instance = this._container._instances.get(prop);
				return instance ?? this[prop];
			}
		});
	}
};
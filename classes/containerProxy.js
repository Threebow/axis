module.exports = class ContainerProxy {
	constructor(container) {
		this._container = container;

		return new Proxy(this, {
			get: (target, prop, receiver) => {
				let instance = this._container._instances.get(prop);
				return instance ?? Reflect.get(target, prop, receiver);
			}
		});
	}
};
const STATE_UNINITIALIZED = 0;
const STATE_INITIALIZING = 1;
const STATE_INITIALIZED = 2;

module.exports = class Container {
	constructor() {
		this._factories = new Map();
		this._instances = new Map();

		this._state = STATE_UNINITIALIZED;
	}

	_mount(app) {
		this._app = app;
	}

	async _initialize() {
		if(this._state !== STATE_UNINITIALIZED) {
			throw new Error("Service container already initialized.");
		}

		this._state = STATE_INITIALIZING;

		for(let [name, fn] of this._factories) {
			let instance = await Promise.resolve(fn(this._app, this));
			this._instances.set(name, instance);
		}

		this._state = STATE_INITIALIZED;
	}

	service(name, fn) {
		this._factories.set(name, fn);
	}

	attach(obj) {
		if(this._state !== STATE_INITIALIZED) {
			throw new Error("Trying to attach uninitialized service container.");
		}

		for(let name of this._instances.keys()) {
			Object.defineProperty(obj, name, {
				get: () => this._instances.get(name),
				configurable: true,
				enumerable: true
			});
		}
	}

	get database() {
		return this._instances.get("Database");
	}

	get cache() {
		return this._instances.get("Cache");
	}

	get disk() {
		return this._instances.get("Disk");
	}
};

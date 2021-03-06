const ContainerProxy = require("./containerProxy");

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

		let proxy = new ContainerProxy(this);

		for(let [name, fn] of this._factories) {
			let instance = await Promise.resolve(fn(this._app, proxy));
			this._instances.set(name, instance);
		}

		this._state = STATE_INITIALIZED;
	}

	service(name, fn) {
		this._factories.set(name, fn);
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

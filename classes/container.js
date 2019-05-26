module.exports = class Container {
	constructor() {
		this.factories = [];
		this.providers = [];
		this.services = {};
	}

	//Register providers to be setup after the app and whatever is initialized
	service(name, fn) {
		this.factories.push({name, fn, type: "service"});
		return this;
	}

	//Register something that modifies the app but doesn't actually return anything
	functionality(fn) {
		this.factories.push({fn, type: "functionality"});
		return this;
	}

	initialize() {
		for(let i = 0; i < this.factories.length; i++) {
			const {name, fn, type} = this.factories[i];

			//Don't do anything if all it does is change the app instance and doesn't return anything
			if(type === "functionality") {
				fn(this.app);
				continue;
			}

			//Call the factory to get the provider
			let provider = fn(this.app);

			//Register the provider
			this.providers.push({provider, name});
		}

		this.attach(this);
	}

	attach(obj) {
		for(let i = 0; i < this.providers.length; i++) {
			const {provider, name} = this.providers[i];

			//Now call the provider method via getter when you access the name on the container
			Object.defineProperty(obj, name, {
				get: () => {
					if(!this.services.hasOwnProperty(name)){
						this.services[name] = provider;
					}

					return this.services[name];
				},
				configurable: true,
				enumerable: true
			});
		}
	}
};
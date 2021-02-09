const bluebird = require("bluebird"),
	  redis    = require("redis");

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports = class RedisCache {
	constructor(options = {}) {
		this._options = options;
	}

	connect() {
		this._client = redis.createClient(this._options);

		return new Promise((resolve, reject) => {
			this._client.on("error", reject);
			this._client.on("connect", resolve);
		});
	}

	async get(key) {
		return JSON.parse(await this._client.getAsync(key));
	}

	async mget(keys) {
		return (await this._client.mgetAsync(keys))
			.map(v => JSON.parse(v));
	}

	set(key, value) {
		return this._client.setAsync(key, JSON.stringify(value));
	}

	setEx(key, ex, value) {
		return this._client.setexAsync(key, ex, JSON.stringify(value));
	}

	del(key) {
		return this._client.delAsync(key);
	}

	async exists(key) {
		return Boolean(parseInt(await this._client.existsAsync(key)));
	}

	hset(...args) {
		return this._client.hsetAsync(...args);
	}

	hget(...args) {
		return this._client.hgetAsync(...args);
	}

	hmget(...args) {
		return this._client.hmgetAsync(...args);
	}

	incr(...args) {
		return this._client.incrAsync(...args);
	}

	async remember(key, fn, ex) {
		let cached = await this.get(key);
		if(cached != null) return cached;

		let val = await fn();
		if(val == null) return;

		if(ex) {
			await this.setEx(key, ex, val);
		} else {
			await this.set(key, val);
		}

		return val;
	}
};
const Middleware = require("../classes/middleware"),
	  session    = require("express-session"),
	  {RedisClient} = require("redis"),
	  RedisStore = require("connect-redis")(session),
	  _          = require("lodash");

const DEFAULT_SESSION_TTL = 60 * 60 * 24 * 7; //one week

module.exports = class SessionMiddleware extends Middleware {
	constructor(...args) {
		super(...args);

		//Only create middleware if session settings are specified in the app
		if(!_.isPlainObject(this._app._expressOptions.session)) return;

		//Enforce the presence of a secret
		if(_.isNil(this._app._expressOptions.session.secret)) {
			throw new Error("Session middleware must be passed a secret.");
		}

		//Create default session settings
		let opts = {
			saveUninitialized: false,
			resave: false
		};

		_.assign(opts, this._app._expressOptions.session);

		//Automatically attatch to cache
		if((this.Cache?.client instanceof RedisClient) && !opts.store) {
			opts.store = new RedisStore({
				client: this.Cache.client,
				ttl: this._app._expressOptions.session?.ttl ?? DEFAULT_SESSION_TTL
			});
		}

		this._session = Middleware.promisifyExpressMiddleware(session(opts));
	}

	async run(req, res) {
		if(this._session) {
			await this._session(req, res);
		}
	}
};
module.exports = class Request {
	constructor(raw, app) {
		this._raw = raw;
		this._app = app;

		this.boundModels = [];
	}

	get path() {
		if(this._path) return this._path;

		let url = new URL(this.url, this._app.settings.url);

		this._path = {
			origin: url.origin,
			protocol: url.protocol,
			pathname: url.pathname,
			href: url.href,
			queryParams: Object.fromEntries(url.searchParams.entries())
		};

		return this._path;
	}

	get params() {
		return this._params || {};
	}

	get query() {
		return this.path.queryParams;
	}

	get body() {
		return this._raw.body;
	}

	get headers() {
		return this._raw.headers;
	}

	get method() {
		return this._raw.method;
	}

	get url() {
		return this._raw.url;
	}

	route(...args) {
		return this._route._root.getNamedRoutePath(...args);
	}
}
const _ = require("lodash"),
	  {STATUS_CODES} = require("http");

const DEFAULT_STATUS_CODE = 200;
const DEFAULT_CHARSET = "utf-8";

module.exports = class Response {
	constructor(raw, app) {
		this._raw = raw;
		this._app = app;

		this.locals = {};
		this.statusCode = DEFAULT_STATUS_CODE;
		this.charset = DEFAULT_CHARSET;
	}

	setHeader(name, value) {
		this._raw.setHeader(name, value);
		return this;
	}

	setContentType(val) {
		return this.setHeader("Content-Type", `${val};charset=${this.charset}`);
	}

	status(code = DEFAULT_STATUS_CODE) {
		this.statusCode = code;
		return this;
	}

	send(val) {
		if(_.isString(val) || _.isBuffer(val)) {
			this.setContentType("text/plain")
				.end(val);
		} else {
			this.setContentType("application/json")
				.end(JSON.stringify(val));
		}
	}

	sendStatus(code) {
		this.status(code);

		if(this.hasBody) {
			this.setContentType("text/plain");
		}

		this.end(STATUS_CODES[code]);
	}

	sendHTML(html) {
		this.setContentType("text/html")
			.end(html);
	}

	async render(view, data = {}) {
		let engine = this._app.settings.viewEngine;
		if(!engine) throw new Error("No view engine specified!");

		let html = await engine.render(view, {...this.locals, ...data});
		this.sendHTML(html);
	}

	end(val) {
		this._raw
			.writeHead(this.statusCode, {"Content-Length": Buffer.byteLength(val)})
			.end(this.hasBody ? val : null);
	}

	redirect(url) {
		this.setHeader("Location", url).end();
	}

	get hasBody() {
		return this.statusCode !== 204;
	}
}
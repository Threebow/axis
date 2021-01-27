module.exports = class RequestValidationError extends Error {
	constructor(errors) {
		let message = errors
			.map(e => e.schemaPath + " " + e.message)
			.join("; ");

		super(message);

		this.name = this.constructor.name;
		this.errors = errors;

		Error.captureStackTrace(this, this.constructor);
	}
};
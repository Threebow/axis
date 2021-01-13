const ErrorHandler = require("../classes/errorHandler"),
	  cases        = require("stringcase"),
	  Ouch         = require("ouch");

module.exports = class HTTPErrorHandler extends ErrorHandler {
	async handle(err, req, res) {
		res.status(err.statusCode);

		//File too large
		if(err.statusCode === 413 && err.type === "FileTooLarge") {
			if(req.wantsJsonResponse) {
				return {};
			} else {
				return this.redirect
					.back()
					.withError("The file(s) that you are trying to upload are too large! Please try again.");
			}
		}

		//Ratelimit
		if(err.statusCode === 429) {
			let remaining = res.get("X-Ratelimit-Reset");

			if(req.wantsJsonResponse) {
				return {};
			} else {
				return this.redirect
					.back()
					.withError(`You are performing this action too quickly! Please try again in ${remaining} seconds.`);
			}
		}

		//CSRF
		if(err.code === "EBADCSRFTOKEN") {
			if(req.wantsJsonResponse) {
				return {type: "InvalidCSRFToken"};
			} else {
				return this.redirect
					.back()
					.withError("You have sent an invalid CSRF token. Please try your request again. If the problem persists, please contact an administrator.");
			}
		}

		//Model validation error
		if(err.statusCode === 400 && err.type === "ModelViolation") {
			let errors = [];

			for(let i in err.data) {
				if(!err.data.hasOwnProperty(i)) continue;

				err.data[i].forEach(obj => {
					errors.push(cases.titlecase(i) + " " + obj.message);
				});
			}

			if(req.wantsJsonResponse) {
				return {
					type: "ViolationError",
					errors
				};
			} else {
				let r = this.redirect
					.back();

				errors.forEach(e => r.withError(e));

				return r;
			}
		}

		//Internal server errors
		if(err.statusCode === 500) {
			if(process.env.NODE_ENV === "development") {
				if(req.wantsJsonResponse) {
					return {
						message: err.message,
						err
					};
				} else {
					let ouch = new Ouch();
					ouch.pushHandler(new Ouch.handlers.PrettyPageHandler("blue", null, "sublime"));
					ouch.handleException(err, req, res);
					return;
				}
			} else {
				if(req.wantsJsonResponse) {
					return {
						eventId: res.sentry
					};
				} else {
					return this.render("error", {
						code: 500,
						eventId: res.sentry
					});
				}
			}
		}

		//All the other HTTP errors
		if(req.wantsJsonResponse) {
			return {
				type: err.message
			};
		} else {
			return this.render("error", {code: err.statusCode});
		}
	}
};
const ErrorHandler = require("../classes/errorHandler"),
	  createError  = require("http-errors"),
	  objection    = require("objection"),
	  multer       = require("multer");

module.exports = class ApplicationErrorHandler extends ErrorHandler {
	handle(err) {
		//Objection errors
		if(err instanceof objection.ValidationError) {
			if(err.type === "ModelValidation") {
				throw createError(400, err, {type: "ModelViolation"});
			} else {
				err.statusCode = 500;
				throw createError(500, err);
			}
		} else if(err instanceof objection.NotFoundError) {
			throw createError(404);
		} else if(err instanceof objection.UniqueViolationError) {
			throw createError(409, err, {type: "UniqueViolation"});
		} else if(err instanceof objection.NotNullViolationError) {
			throw createError(400, err, {type: "NotNullViolation"});
		} else if(err instanceof objection.ForeignKeyViolationError) {
			throw createError(409, err, {type: "ForeignKeyViolation"});
		} else if(err instanceof objection.CheckViolationError) {
			throw createError(400, err, {type: "CheckViolation"});
		} else if(err instanceof objection.DataError) {
			throw createError(400, err, {type: "InvalidData"});
		} else if(err instanceof objection.DBError) {
			throw createError(500, err);
		}

		//Multer file limit error
		if(err instanceof multer.MulterError) {
			if(err.code === "LIMIT_FILE_SIZE") {
				throw createError(413, err, {type: "FileTooLarge"});
			}
		}

		//All other errors
		throw createError(500, err);
	}
};
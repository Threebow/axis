const pathToRegexp = require("path-to-regexp"),
	  crypto       = require("crypto");

/*---------------------------------------------------------------------------
	Make sure our route names always start with a slash internally
---------------------------------------------------------------------------*/
module.exports.FormatPathName = (str) => {
	return str.startsWith("/") ? str : "/" + str;
};

module.exports.ResolveRoute = (name, params) => {
	//Return the plain path if there are no arguments
	let path = RouteList[name];
	if(!path) throw new Error(`A route named '${name}' does not exist.`);
	if(!params) return path;

	//Compile the path with the given parameters if they are given
	let compiled = pathToRegexp.compile(path);
	return compiled(params);
};

module.exports.WrapAsyncFunction = (fn) => {
	return async function(...args) {
		let next = args[args.length - 1];

		try {
			await Promise.resolve(fn(...args));
		} catch(e) {
			return next(e);
		}
	};
};

module.exports.GenerateID = (length = 32) => {
	return new Promise((resolve, reject) => {
		crypto.randomBytes(length / 2, (err, buffer) => {
			if(err) return reject(err);
			resolve(buffer.toString("hex"));
		});
	});
};
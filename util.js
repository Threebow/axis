const pathToRegexp = require("path-to-regexp"),
	  _ = require("lodash");

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

module.exports.WrapMiddleware = (fn, req, res) => {
	return new Promise((resolve, reject) => {
		fn(req, res, (err) => {
			if(err) return reject(err);
			resolve();
		});
	});
}

module.exports.MergeMiddleware = (target, source) => {
	let temp = _.clone(source._middleware);

	target._middleware.forEach(name => {
		temp.add(name);
	});

	temp.forEach(name => {
		target._middlewareArgs.set(name, source._middlewareArgs.get(name));
	});

	target._middleware = temp;
}
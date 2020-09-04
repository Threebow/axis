const pathToRegexp = require("path-to-regexp");

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
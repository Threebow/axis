/*---------------------------------------------------------------------------
	Prints out all of the application's routes
	Credit: https://github.com/expressjs/express/issues/3308#issuecomment-300957572
---------------------------------------------------------------------------*/
module.exports.printRoutes = (app) => {
	function print(path, layer) {
		if(layer.route) {
			layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))))
		} else if(layer.name === 'router' && layer.handle.stack) {
			layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))))
		} else if(layer.method) {
			console.log('%s /%s',
				layer.method.toUpperCase(),
				path.concat(split(layer.regexp)).filter(Boolean).join('/'))
		}
	}

	function split(thing) {
		if(typeof thing === 'string') {
			return thing.split('/')
		} else if(thing.fast_slash) {
			return ''
		} else {
			var match = thing.toString()
				.replace('\\/?', '')
				.replace('(?=\\/|$)', '$')
				.match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//)
			return match
				? match[1].replace(/\\(.)/g, '$1').split('/')
				: '<complex:' + thing.toString() + '>'
		}
	}

	app._router.stack.forEach(print.bind(null, []));
};
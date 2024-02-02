import { parse } from "acorn"
import { relative } from "path"

export default function (source) {
	// parse the export into an AST
	let ast
	try {
		ast = parse(source, {
			ecmaVersion: 2024,
			sourceType: "module"
		})
	} catch {
		return source
	}

	// ensure we have the correct declaration
	const ex = ast.body[ast.body.length - 1]
	if (ex.type !== "ExportDefaultDeclaration" || ex.declaration.name !== "__exports__") {
		return source
	}

	// parse the file name to inject
	const filename = this.resourcePath.replace(/\?.*$/, "")
	const delta = relative(this.rootContext || process.cwd(), filename)
	const rawPath = delta
		.replace(/^(\.\.[\/\\])+/, "")
		.replace(/\\/g, "/")

	// inject the filename
	source += "\n\n"
	source += "__exports__.__FILENAME__ = " + JSON.stringify(rawPath)

	return source
}

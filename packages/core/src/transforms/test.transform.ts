import { API, FileInfo } from "jscodeshift"

export default function transformer(file: FileInfo, api: API) {
	console.log(file)
	
	return api
		.jscodeshift(file.source)
		.findVariableDeclarators("foo")
		.renameTo("bar")
		.toSource()
}

import { relative } from "path"

export default function (source) {
	if (source.includes("script.render = render") || source.includes("script.ssrRender = ssrRender")) {
		const filename = this.resourcePath.replace(/\?.*$/, "")
		const delta = relative(this.rootContext || process.cwd(), filename)
		const rawPath = delta
			.replace(/^(\.\.[\/\\])+/, "")
			.replace(/\\/g, "/")

		source += "\n\n"
		source += "script.__FILENAME__ = " + JSON.stringify(rawPath)
	}

	return source
}

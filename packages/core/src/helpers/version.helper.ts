export function getVersionString(): string {
	return "v" + (process.env.npm_package_version || "?.?.?")
}

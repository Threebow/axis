function unique(str: string): string {
	return "Axis_" + str
}

export namespace Constants {
	export const LOCALS = unique("Locals")
	
	export const APP_LOCALS = unique("AppLocals")
	
	export const ROUTE = unique("Route")
}

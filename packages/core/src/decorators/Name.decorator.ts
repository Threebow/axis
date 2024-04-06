/**
 * Decorator to add a name to a controller or a route. Routes are named automatically based on the name of the
 * handler function in the controller, but this decorator may be used to manually override that. This is used to
 * build named routes.
 */
export function Name(name: string) {
	return Reflect.metadata("name", name)
}

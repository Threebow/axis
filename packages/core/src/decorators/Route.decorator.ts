export enum RouteVerb {
	GET = "get",
	POST = "post",
	PUT = "put",
	HEAD = "head",
	DELETE = "delete",
	OPTIONS = "options",
	PATCH = "patch"
}

export type RouteMetadata = {
	verb: RouteVerb
	uri: string
}

function Route(verb: RouteVerb, uri: string) {
	return Reflect.metadata("route", { verb, uri })
}

export function Get(uri: string = "/") {
	return Route(RouteVerb.GET, uri)
}

export function Post(uri: string = "/") {
	return Route(RouteVerb.POST, uri)
}

export function Put(uri: string = "/") {
	return Route(RouteVerb.PUT, uri)
}

export function Head(uri: string = "/") {
	return Route(RouteVerb.HEAD, uri)
}

export function Delete(uri: string = "/") {
	return Route(RouteVerb.DELETE, uri)
}

export function Options(uri: string = "/") {
	return Route(RouteVerb.OPTIONS, uri)
}

export function Patch(uri: string = "/") {
	return Route(RouteVerb.PATCH, uri)
}

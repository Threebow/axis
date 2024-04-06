import { isFunction } from "lodash-es"
import HTTPError from "http-errors"
import Router from "koa-router"
import { Context as KoaContext } from "koa"
import { MountedController, RouteMetadata, ValidationMetadata } from "../decorators"
import { IApp } from "./App"
import { MiddlewareConstructor } from "./Middleware"
import camelcase from "camelcase"
import assert from "node:assert"

type Route = RouteMetadata & Readonly<{
	name: string
	fullPath: string
	validators: ValidationMetadata[]
}>

const PATH_SEPARATOR = "."
const SLASH = "/"

// TODO: use symbols,constants for all reflect metadata keys

export type ControllerConstructor = new (app: IApp, parent?: Controller, ignorePrefix?: boolean) => Controller

// FIXME: use privates and add interface
export abstract class Controller {
	readonly name: string
	
	readonly middleware: MiddlewareConstructor[] = Reflect.getOwnMetadata("middleware", this.constructor) ?? []
	
	readonly children: MountedController[] = Reflect.getOwnMetadata("mount", this.constructor) ?? []
	readonly childInstances: Controller[] = []
	
	readonly router = new Router()
	readonly routes: Route[] = []
	
	constructor(readonly app: IApp, readonly parent?: Controller, private readonly ignorePrefix = false) {
		let name = Reflect.getOwnMetadata("name", this.constructor)
		
		// if the name has not been set from metadata, convert the class name to camelcase
		if (!name) {
			name = this.constructor.name
			
			// strip controller suffix if present
			if (name.endsWith(Controller.name)) {
				name = name.slice(0, Controller.name.length * -1)
			}
			
			name = camelcase(name, { preserveConsecutiveUppercase: true })
		}
		
		// set name
		this.name = name
		
		// inherit middleware from parent controllers
		this.middleware = [
			...(this.parent ? this.parent.middleware : []),
			...this.middleware
		]
		
		// auto-detect registered routes
		const pt = Object.getPrototypeOf(this)
		
		this.routes = Object
			.getOwnPropertyNames(pt)
			.filter(name => name !== "constructor")
			.map(name => {
				const tag = `"${name}@${this.constructor.name}"`
				
				const desc = Object.getOwnPropertyDescriptor(pt, name)
				assert.ok(desc, `Invalid route implementation for method ${tag}`)
				
				const metadata: RouteMetadata | undefined = Reflect.getMetadata("route", this, name)
				assert.ok(
					metadata,
					`Route metadata not found for method ${tag}. `
					+ `Did you forget to add the @Get, @Post, etc. decorator?`
				)
				
				// calculate full path
				let fullPath = metadata.uri
				
				let self: Controller = this
				let parent = this.parent
				
				while (parent) {
					const mountDef = parent.children
						.find(c => c.ctor === self.constructor)
					
					assert.ok(mountDef, "could not find mount definition for child controller in parent")
					
					fullPath = mountDef.uri + fullPath
					
					self = parent
					parent = parent.parent
				}
				
				// slice trailing slash if present
				if (fullPath !== SLASH && fullPath.endsWith(SLASH)) {
					fullPath = fullPath.slice(0, -SLASH.length)
				}
				
				return {
					name,
					fullPath,
					validators: Reflect.getMetadata("validate", this, name) ?? [],
					isApi: Reflect.getMetadata("api", this, name) ?? false,
					...metadata
				}
			})
		
		// register routes
		this.routes.forEach(route => {
			this.router[route.verb](
				route.uri,
				(ctx: KoaContext) => this.onRequest(route, ctx)
			)
		})
		
		// instantiate child controllers
		for (const { uri, ctor } of this.children) {
			const child = new ctor(this.app, this)
			this.childInstances.push(child)
			
			this.router.use(uri, child.router.routes(), child.router.allowedMethods({ throw: true }))
		}
	}
	
	private async onRequest(route: Route, koaCtx: KoaContext) {
		// init a custom context for this request
		const ctx = this.app.createContext(koaCtx)
		await ctx.initialize()
		
		// store this last loaded route in the user's session
		if (this.app.useSessions) {
			ctx.session.lastRequest = koaCtx.request.path
		}
		
		// first of all, if we have validation rules, we need to run them
		if (route.validators.length > 0) {
			await Promise.all(
				route.validators.map(v => ctx.validator.validate(v))
			)
		}
		
		// run middleware
		for (const ctor of this.middleware) {
			const mw = new ctor(this.app)
			
			if (!await mw.execute(ctx)) {
				return
			}
		}
		
		// find executor function
		const fn = this[route.name as keyof this]
		
		// check to ensure it's implemented correctly in the controller
		if (!isFunction(fn)) {
			throw new HTTPError.NotImplemented()
		}
		
		// run the function and get the result
		const result = await fn.bind(this)(ctx)
		
		// at this point, we are done all controller processing, so we can pass the response
		// directly to the context to be processed appropriately
		await ctx.respond(result)
	}
	
	resolveRoute(target: string): Route | null {
		assert.ok(target.length > 0, "target must be a non-empty string")
		
		// iterate over each route and check if it matches the target
		for (const route of this.routes) {
			if (route.name === target) {
				return route
			}
		}
		
		// if we've got no matches, we need to recursively check this controller's child controllers
		for (const child of this.childInstances) {
			const testStr = child.name + PATH_SEPARATOR
			
			if (!target.startsWith(testStr)) continue
			
			const match = child.resolveRoute(target.slice(testStr.length))
			
			if (match) {
				return match
			}
		}
		
		// no route could be found
		return null
	}
}

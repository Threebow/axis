import { isFunction, isNumber } from "lodash-es"
import HTTPError from "http-errors"
import Router from "koa-router"
import { Context as KoaContext } from "koa"
import { MountedController, RouteMetadata, ValidationMetadata } from "../decorators"
import { IApp } from "./App"
import { MiddlewareConstructor } from "./Middleware"
import camelcase from "camelcase"
import assert from "node:assert"
import { GuardConstructor, GuardResult } from "./Guard"
import { IContext } from "./Context"
import { Renderer } from "./Renderer"

type Route = RouteMetadata & Readonly<{
	name: string
	fullName: string
	fullPath: string
	validators: ValidationMetadata[]
}>

const PATH_SEPARATOR = "."
const SLASH = "/"

// TODO: use symbols,constants for all reflect metadata keys

export type ControllerConstructor = new (app: IApp, parent?: Controller, name?: string) => Controller

// FIXME: use privates and add interface
export abstract class Controller {
	readonly name: string
	
	readonly middleware: MiddlewareConstructor[] = Reflect.getOwnMetadata("middleware", this.constructor) ?? []
	
	readonly children: MountedController[] = Reflect.getOwnMetadata("mount", this.constructor) ?? []
	readonly childInstances: Controller[] = []
	
	readonly guard?: GuardConstructor = Reflect.getOwnMetadata("guard", this.constructor)
	
	readonly router = new Router()
	readonly routes: Route[] = []
	
	constructor(readonly app: IApp, readonly parent?: Controller, name?: string) {
		// derive name from constructor name if not provided
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
				let fullName = name
				
				let self: Controller = this
				let parent = this.parent
				
				while (parent) {
					const mountDef = parent.children
						.find(c => c.ctor === self.constructor && c.name === self.name)
					
					assert.ok(mountDef, "could not find mount definition for child controller in parent")
					
					fullPath = mountDef.uri + fullPath
					fullName = mountDef.name + PATH_SEPARATOR + fullName
					
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
					fullName,
					validators: Reflect.getMetadata("validate", this, name) ?? [],
					isApi: Reflect.getMetadata("api", this, name) ?? false,
					...metadata
				}
			})
		
		// register routes
		for (const route of this.routes) {
			this.router[route.verb](
				route.uri,
				(ctx: KoaContext) => this.#onRequest(route, ctx)
			)
		}
		
		// instantiate child controllers
		for (const { name, uri, ctor } of this.children) {
			const child = new ctor(this.app, this, name)
			this.childInstances.push(child)
			
			this.router.use(uri, child.router.routes(), child.router.allowedMethods({ throw: true }))
		}
	}
	
	async #evaluateGuard(ctx: IContext): Promise<GuardResult> {
		const evaluate = async (ctor: GuardConstructor): Promise<GuardResult> => {
			const guard = new ctor(this.app)
			return guard.isAllowed(ctx)
		}
		
		const walk = async (controller: Controller = this): Promise<GuardResult> => {
			if (controller.guard) {
				const result = await evaluate(controller.guard)
				
				// if any guard doesn't return true, that means it failed, so stop
				if (result !== true) {
					return result
				}
			}
			
			// walk up the parent chain until we find a guard that fails
			if (controller.parent) {
				return walk(controller.parent)
			}
			
			// either no guard found in the chain, or all guards passed
			return true
		}
		
		return walk()
	}
	
	async #onRequest(route: Route, koaCtx: KoaContext) {
		// init a custom context for this request
		const ctx = this.app.createContext(koaCtx)
		await ctx.initialize()
		
		// evaluate the guard
		const allowed = await this.#evaluateGuard(ctx)
		
		// in the case a number is returned from the guard, respond early
		if (isNumber(allowed)) {
			await ctx.respond(allowed)
			return
		}
		
		// if the guard returns false, throw a forbidden error as the default behavior
		if (allowed !== true) {
			throw new HTTPError.Forbidden()
		}
		
		// store this last loaded route in the user's session
		if (this.app.useSessions) {
			ctx.session.lastRequest = koaCtx.request.path
		}
		
		// run middleware
		for (const ctor of this.middleware) {
			const mw = new ctor(this.app)
			
			if (!await mw.execute(ctx)) {
				return
			}
		}
		
		// if we have validation rules, we need to run them
		if (route.validators.length > 0) {
			await Promise.all(
				route.validators.map(v => ctx.validator.validate(v))
			)
		}
		
		// find executor function
		const fn = this[route.name as keyof this]
		
		// check to ensure it's implemented correctly in the controller
		if (!isFunction(fn)) {
			throw new HTTPError.NotImplemented()
		}
		
		// run the function and get the result
		const result = await fn.bind(this)(ctx)
		
		// if the result is a renderer, we need to inject the route
		if (result instanceof Renderer) {
			result.setRouteName(route.fullName)
		}
		
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

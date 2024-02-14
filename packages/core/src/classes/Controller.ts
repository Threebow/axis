import { isFunction } from "lodash-es"
import HTTPError from "http-errors"
import Router from "koa-router"
import { Context as KoaContext } from "koa"
import { MountedController, RouteMetadata, ValidationMetadata } from "../decorators"
import { IApp } from "./App"
import { MiddlewareConstructor } from "./Middleware"

type Route = RouteMetadata & Readonly<{
	name: string,
	validators: ValidationMetadata[]
}>

// TODO: use symbols,constants for all reflect metadata keys

export type ControllerConstructor = new (app: IApp, parent?: Controller) => Controller

export abstract class Controller {
	readonly middleware: MiddlewareConstructor[] = Reflect.getOwnMetadata("middleware", this.constructor) ?? []
	
	readonly children: MountedController[] = Reflect.getOwnMetadata("mount", this.constructor) ?? {}
	readonly childInstances: Controller[] = []
	
	readonly router = new Router()
	readonly routes: Route[] = []
	
	constructor(readonly app: IApp, readonly parent?: Controller) {
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
				const desc = Object.getOwnPropertyDescriptor(pt, name)
				
				if (!desc) {
					throw new Error("Invalid route implementation")
				}
				
				return {
					name,
					validators: Reflect.getMetadata("validate", this, name) ?? [],
					isApi: Reflect.getMetadata("api", this, name) ?? false,
					...Reflect.getMetadata("route", this, name) as RouteMetadata
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
		for (const id in this.children) {
			const { uri, ctor } = this.children[id]
			
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
		for (let i = 0; i < this.middleware.length; i++) {
			const mw = new this.middleware[i](this.app)
			
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
}

import Koa from "koa"
import { createServer, Server } from "http"
import serve from "koa-static"
import session from "koa-session"
import { BaseUserDTO } from "../dto"
import { IBaseUser } from "./User"
import { IContext } from "./Context"
import { fromJson, getVersionString } from "../helpers"
import { fatalErrorHandler, genericErrorHandler, httpErrorTransformer } from "../koa/handlers"
import { resolve } from "path"
import { existsSync, readFileSync } from "fs"
import { AppOptions } from "./AppOptions"
import { KVObject } from "../types"
import morgan from "morgan"
import { bodyParser } from "@koa/bodyparser"
import { Controller } from "./Controller"
import { AppError, AppErrorType } from "./AppError"
import { compile, PathFunction } from "path-to-regexp"

/**
 * Defines the host and port that the app has successfully started to listen on.
 */
export type AppBootResult = {
	host: string
	port: number
}

/**
 * A manifest of assets that have been built. This is resolved automatically.
 */
export type AssetManifest = KVObject<string | undefined>

export interface IApp<
	UserDTO extends BaseUserDTO = BaseUserDTO,
	UserClass extends IBaseUser<UserDTO> = IBaseUser<UserDTO>,
	LocalsDTO extends KVObject = {},
	Context extends IContext<UserDTO, UserClass, LocalsDTO> = IContext<UserDTO, UserClass, LocalsDTO>
> {
	readonly opts: AppOptions<UserDTO, UserClass, LocalsDTO, Context>
	readonly version: string
	
	readonly koa: Koa<void, Context>
	readonly koaServer: Server
	
	readonly assetManifest: AssetManifest
	
	readonly useSessions: boolean
	
	boot(): Promise<AppBootResult>
	
	createContext(koaCtx: Koa.Context): Context
	
	shutdown(): Promise<void>
	
	/**
	 * Attempts to resolve a route's full path from the root controller
	 */
	resolveRouteFullPath<T extends KVObject = {}>(target: string, data?: T): string
}

type CachedRoute = {
	fullPath: string
	render?: PathFunction
}

export class App<
	UserDTO extends BaseUserDTO = BaseUserDTO,
	UserClass extends IBaseUser<UserDTO> = IBaseUser<UserDTO>,
	LocalsDTO extends KVObject = {},
	Context extends IContext<UserDTO, UserClass, LocalsDTO> = IContext<UserDTO, UserClass, LocalsDTO>
> implements IApp<UserDTO, UserClass, LocalsDTO, Context> {
	readonly version = getVersionString()
	
	// create koa and server instances
	readonly koa = new Koa<void, Context>()
	readonly koaServer = createServer(this.koa.callback())
	
	// read asset manifest
	private readonly manifestPath = resolve(this.opts.dist, "./assets-manifest.json")
	
	readonly assetManifest: AssetManifest = existsSync(this.manifestPath)
		? fromJson(readFileSync(this.manifestPath, "utf8"))
		: {}
	
	// determine if sessions are enabled
	readonly useSessions = this.opts.sessionKey != null
	
	private readonly rootController: Controller
	
	private readonly routeCache: Map<string, CachedRoute> = new Map()
	
	constructor(readonly opts: AppOptions<UserDTO, UserClass, LocalsDTO, Context>) {
		// set session key
		if (this.useSessions) {
			this.koa.keys = [this.opts.sessionKey!]
		}
		
		// apply internal error handlers
		this.koa
			.use(fatalErrorHandler())
			.use(genericErrorHandler(this))
		
		// apply custom error handlers
		if (this.opts.errorHandlers?.length) {
			for (const handler of this.opts.errorHandlers) {
				this.koa.use(handler)
			}
		}
		
		// apply final error transformer
		this.koa
			.use(httpErrorTransformer())
		
		// add some generic middleware
		this.koa
			.use(serve(resolve(opts.dist, "./frontend"), { maxage: 24 * 60 * 60 * 1000 }))
			.use(bodyParser({ ...(opts.bodyParserOptions ?? {}), encoding: "utf8" }))
		
		// enable logging
		if (this.opts.loggingEnabled) {
			const mw = morgan("tiny")
			
			this.koa.use((ctx, next) => {
				return new Promise((resolve, reject) => {
					mw(ctx.req, ctx.res, (err) => {
						err ? reject(err) : resolve(ctx)
					})
				}).then(next)
			})
		}
		
		// enable session middleware if session key is set
		if (this.useSessions) {
			this.koa.use(session({}, this.koa))
		}
		
		// mount the root controller
		// FIXME: should not be casting to any so aggressively
		const rootController = new opts.rootController(this as IApp<any, any, any, any>)
		
		// add a simple health check route
		rootController.router.get("/health-check", async (ctx) => {
			ctx.status = 200
			
			if (opts.healthCheckData) {
				ctx.body = await opts.healthCheckData()
			}
		})
		
		this.koa
			.use(rootController.router.routes())
			.use(rootController.router.allowedMethods({ throw: true }))
		
		this.rootController = rootController
	}
	
	boot(): Promise<AppBootResult> {
		return new Promise<AppBootResult>((resolve) => {
			const port = this.opts.port ?? 3000
			const host = this.opts.host ?? "0.0.0.0"
			this.koaServer.listen(port, host, () => resolve({ host, port }))
		})
	}
	
	createContext(koaCtx: Koa.Context): Context {
		// FIXME: this is very ugly but idk how else to do it
		return new this.opts.context(this as IApp<any, any, any, any>, koaCtx)
	}
	
	shutdown(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.koaServer.closeAllConnections()
			
			this.koaServer.close((err) => {
				if (err) {
					reject(err)
					return
				}
				
				resolve()
			})
		})
	}
	
	resolveRouteFullPath<T extends KVObject = {}>(target: string, data?: T): string {
		let cached = this.routeCache.get(target)
		
		// resolve and cache the route if we haven't done so yet
		if (!cached) {
			// attempt to find the route
			const route = this.rootController.resolveRoute(target)
			
			// throw an error if the route was not found
			if (!route) {
				throw new AppError(
					AppErrorType.INVALID_ROUTE,
					`Unable to resolve route "${target}": not found`
				)
			}
			
			const fullPath = route.fullPath
			
			cached = {
				fullPath,
				render: fullPath.includes(":") ? compile(fullPath) : undefined
			}
			
			// cache the result
			this.routeCache.set(target, cached)
		}
		
		// render the route if it has dynamic segments
		if (data && cached.render) {
			return cached.render(data)
		}
		
		return cached.fullPath
	}
}

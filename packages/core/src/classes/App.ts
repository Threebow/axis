import Koa from "koa"
import { createServer, Server } from "http"
import serve from "koa-static"
import bodyParser from "koa-bodyparser"
import session from "koa-session"
import { BaseLocalsDTO, BaseUserDTO } from "../dto"
import { IBaseUser } from "./User"
import { ContextConstructor, IContext } from "./Context"
import { ControllerConstructor } from "./Controller"
import { PageMeta, ViewComponent } from "../types"
import { AssetManifest } from "./AssetManifest"
import { getVersionString } from "../helpers"
import { fatalErrorHandler, genericErrorHandler, httpErrorTransformer } from "../koa/handlers"

export enum AppMode {
	DEVELOPMENT,
	PRODUCTION
}

export type AppOptions<
	UserDTO extends BaseUserDTO,
	UserClass extends IBaseUser<UserDTO>,
	LocalsDTO extends BaseLocalsDTO<UserDTO>,
	Context extends IContext<UserDTO, UserClass, LocalsDTO>
> = {
	/**
	 * The mode the app is running in.
	 */
	mode: AppMode
	
	/**
	 * The host the app should listen on.
	 */
	host?: string
	
	/**
	 * The port the app should listen on.
	 */
	port?: number
	
	/**
	 * The secret used to sign the session cookie.
	 */
	sessionKey: string
	
	/**
	 * The constructor of the root controller of the app.
	 */
	rootController: ControllerConstructor
	
	/**
	 * The error page to render when an error occurs.
	 * This should be a Vue component with {ErrorDTO} as its props.
	 */
	errorPage: ViewComponent
	
	/**
	 * A function that resolves the user from the session.
	 * This is used to inject the user into the context.
	 * If the user is not found, this should throw.
	 */
	resolveUser: (id: string) => Promise<UserClass>
	
	/**
	 * Used to extend the default app context. The constructor of the context class to use.
	 */
	context: ContextConstructor<Context>
	
	/*
		// FIXME: this stuff probably needs to be passed in as arguments or options instead of being hard-coded
		const LAYOUTS = require.context("@/modules", true, /layout\.vue$/)
	 */
	
	/**
	 * The root directory of the app modules.
	 * @example "./src/modules"
	 */
	moduleRoot: string
	
	/**
	 * The asset manifest, this should be read from the build output and passed in.
	 */
	assetManifest: AssetManifest
	
	/**
	 * A freshly-created require context that targets the modules directory.
	 */
	modules: __WebpackModuleApi.RequireContext
	
	/**
	 * Various options for the renderer.
	 */
	renderer: {
		/**
		 * Path to the transpiled Pug index source file located in the build output.
		 * @example "./dist/backend/index.pug"
		 */
		indexPage: string
		
		/**
		 * A freshly-created require context that targets the layout components.
		 * TODO: should this and moduleRoot be merged?
		 */
		layouts: __WebpackModuleApi.RequireContext,
		
		/**
		 * The default page meta to use when none is provided per view.
		 */
		defaultPageMeta: PageMeta
	}
}

/**
 * Defines the host and port that the app has successfully started to listen on.
 */
type AppBootResult = {
	host: string
	port: number
}

// FIXME: figure out how to make the two more DRY by not repeating the generic types

export interface IApp<
	UserDTO extends BaseUserDTO = BaseUserDTO,
	UserClass extends IBaseUser<UserDTO> = IBaseUser<UserDTO>,
	LocalsDTO extends BaseLocalsDTO<UserDTO> = BaseLocalsDTO<UserDTO>,
	Context extends IContext<UserDTO, UserClass, LocalsDTO> = IContext<UserDTO, UserClass, LocalsDTO>
> {
	readonly opts: AppOptions<UserDTO, UserClass, LocalsDTO, Context>
	readonly version: string
	
	readonly koa: Koa<void, Context>
	readonly koaServer: Server
	
	boot(): Promise<AppBootResult>
	
	createContext(koaCtx: Koa.Context): Context
	
	shutdown(): Promise<void>
}

export class App<
	UserDTO extends BaseUserDTO = BaseUserDTO,
	UserClass extends IBaseUser<UserDTO> = IBaseUser<UserDTO>,
	LocalsDTO extends BaseLocalsDTO<UserDTO> = BaseLocalsDTO<UserDTO>,
	Context extends IContext<UserDTO, UserClass, LocalsDTO> = IContext<UserDTO, UserClass, LocalsDTO>
> implements IApp<UserDTO, UserClass, LocalsDTO, Context> {
	readonly version = getVersionString()
	
	// create koa and server instances
	readonly koa = new Koa<void, Context>()
	readonly koaServer = createServer(this.koa.callback())
	
	constructor(readonly opts: AppOptions<UserDTO, UserClass, LocalsDTO, Context>) {
		// set session key
		this.koa.keys = [opts.sessionKey]
		
		// define error handlers
		this.koa
			.use(fatalErrorHandler())
			.use(genericErrorHandler({
				app: this,
				expose: opts.mode === AppMode.DEVELOPMENT,
				errorPage: opts.errorPage
			}))
			.use(httpErrorTransformer())
		
		// add some generic middleware
		this.koa
			.use(serve("./dist/frontend/", { maxage: 24 * 60 * 60 * 1000 }))
			.use(bodyParser())
			.use(session({}, this.koa))
		
		// mount the root controller
		// FIXME: should not be casting to any so aggressively
		const rootController = new opts.rootController(this as IApp<any, any, any, any>)
		
		// add a simple health check route
		rootController.router.get("/health-check", (ctx) => {
			ctx.status = 200
			ctx.body = "OK"
		})
		
		this.koa
			.use(rootController.router.routes())
			.use(rootController.router.allowedMethods({ throw: true }))
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
}

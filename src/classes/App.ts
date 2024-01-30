import { BaseLocalsDTO, ContextConstructor, ControllerConstructor, IContext } from "@"
import Koa from "koa"
import { createServer, Server } from "http"
import { fatalErrorHandler, genericErrorHandler, httpErrorTransformer } from "@/koa/handlers"
import serve from "koa-static"
import bodyParser from "koa-bodyparser"
import session from "koa-session"
import { ViewComponent } from "@/types/common"
import { IUser } from "@/classes/User"
import { BaseUserDTO } from "@/dto/User.dto"
import { getVersionString } from "@/helpers/version.helper"
import { AssetManifest } from "@/classes/AssetManifest"

export enum AppMode {
	DEVELOPMENT,
	PRODUCTION
}

export type AppOptions<
	UserDTO extends BaseUserDTO,
	UserClass extends IUser<UserDTO>,
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
		layouts: __WebpackModuleApi.RequireContext
	}
}

/**
 * Defines the host and port that the app has successfully started to listen on.
 */
type AppListenResult = {
	host: string
	port: number
}

// FIXME: figure out how to make the two more DRY by not repeating the generic types

export interface IApp<
	UserDTO extends BaseUserDTO = BaseUserDTO,
	UserClass extends IUser<UserDTO> = IUser<UserDTO>,
	LocalsDTO extends BaseLocalsDTO<UserDTO> = BaseLocalsDTO<UserDTO>,
	Context extends IContext<UserDTO, UserClass, LocalsDTO> = IContext<UserDTO, UserClass, LocalsDTO>
> {
	readonly opts: AppOptions<UserDTO, UserClass, LocalsDTO, Context>
	readonly version: string
	
	readonly koa: Koa<void, Context>
	readonly koaServer: Server
	
	listen(): Promise<AppListenResult>
	
	createContext(koaCtx: Koa.Context): Context
}

export class App<
	UserDTO extends BaseUserDTO = BaseUserDTO,
	UserClass extends IUser<UserDTO> = IUser<UserDTO>,
	LocalsDTO extends BaseLocalsDTO<UserDTO> = BaseLocalsDTO<UserDTO>,
	Context extends IContext<UserDTO, UserClass, LocalsDTO> = IContext<UserDTO, UserClass, LocalsDTO>
> implements IApp<UserDTO, UserClass, LocalsDTO, Context> {
	readonly version = getVersionString()
	
	// create koa and server instances
	readonly koa = new Koa<void, Context>()
	readonly koaServer = createServer(this.koa.callback())
	
	constructor(readonly opts: AppOptions<UserDTO, UserClass, LocalsDTO, Context>) {
		console.log("got options", opts)
		
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
		// FIXME: this is very ugly but idk how else to do it
		const rootController = new opts.rootController(this as IApp<any, any, any, any>)
		
		this.koa
			.use(rootController.router.routes())
			.use(rootController.router.allowedMethods())
	}
	
	listen(): Promise<AppListenResult> {
		return new Promise<AppListenResult>((resolve) => {
			const port = this.opts.port ?? 3000
			const host = this.opts.host ?? "0.0.0.0"
			this.koaServer.listen(port, host, () => resolve({ host, port }))
		})
	}
	
	createContext(koaCtx: Koa.Context): Context {
		// FIXME: this is very ugly but idk how else to do it
		return new this.opts.context(this as IApp<any, any, any, any>, koaCtx)
	}
}

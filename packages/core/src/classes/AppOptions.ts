import { BaseUserDTO } from "../dto"
import { IBaseUser } from "./User"
import { ContextConstructor, IContext } from "./Context"
import { ControllerConstructor } from "./Controller"
import { KVObject, PageMeta, ViewComponent } from "../types"
import { PotentialPromise } from "webpack-cli"
import { bodyParser } from "@koa/bodyparser"
import { Context as KoaContext, Next as KoaNext } from "koa"
import session from "koa-session"

// good meme
export type BodyParserOptions = Omit<NonNullable<Parameters<typeof bodyParser>[0]>, "encoding">

export type ErrorHandler = (ctx: KoaContext, next: KoaNext) => Promise<void>

export enum AppMode {
	DEVELOPMENT,
	PRODUCTION
}

/**
 * Various options for the renderer. If undefined, the renderer will be unusable.
 */
export type RendererOptions = {
	/**
	 * Path to the transpiled Pug index source file located in the build output.
	 * @example "./dist/backend/index.pug"
	 */
	indexPage: string
	
	/**
	 * The error page to render when an error occurs.
	 * This should be a Vue component with {ErrorDTO} as its props.
	 */
	errorPage: ViewComponent
	
	/**
	 * A freshly-created require context that targets the layout components.
	 */
	layouts: __WebpackModuleApi.RequireContext,
	
	/**
	 * The default page meta to use when none is provided per view.
	 */
	defaultPageMeta: PageMeta
}

export type AppOptions<
	UserDTO extends BaseUserDTO,
	UserClass extends IBaseUser<UserDTO>,
	LocalsDTO extends KVObject,
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
	sessionKey?: string
	
	/**
	 * Options passed through to koa-session
	 */
	sessionOptions?: session.opts<void, Context>
	
	/**
	 * The constructor of the root controller of the app.
	 */
	rootController: ControllerConstructor
	
	/**
	 * A function that resolves the user from the session.
	 * This is used to inject the user into the context.
	 * If the user is not found, this can return false.
	 * If this is not provided, users will not be resolved.
	 */
	resolveUser?: (id: string) => Promise<UserClass | false>
	
	/**
	 * Used to extend the default app context. The constructor of the context class to use.
	 */
	context: ContextConstructor<Context>
	
	/**
	 * The root directory of the app modules.
	 * @example "./src/modules"
	 */
	moduleRoot: string
	
	/**
	 * Options for the renderer. If undefined, the renderer will be unusable.
	 */
	renderer?: RendererOptions
	
	/**
	 * Optional data returned from health checks
	 */
	healthCheckData?: () => PotentialPromise<KVObject>
	
	/**
	 * The filepath to the directory that contains the app's built files
	 */
	dist: string
	
	/**
	 * Whether to enable request logging
	 */
	loggingEnabled?: boolean
	
	/**
	 * Body parser options
	 */
	bodyParserOptions?: BodyParserOptions
	
	/**
	 * Additional error handlers that are ran before the internal error handlers.
	 */
	errorHandlers?: ErrorHandler[]
}

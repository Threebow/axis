import { Context as KoaContext } from "koa"
import { Session } from "koa-session"
import { isFunction, isNil, isNumber } from "lodash-es"
import HTTPError from "http-errors"
import { DTO, KVObject } from "../types"
import { IExecutable, isExecutable } from "./Executable"
import { BaseUserDTO } from "../dto"
import { IApp } from "./App"
import { IValidator, Validator } from "./Validator"
import { Responder } from "./Responder"
import { IBaseUser } from "./User"
import { resolveIpAddressFromIncomingMessage } from "../helpers/backend"
import { ContextHeaders, IContextHeaders } from "./ContextHeaders"

export type ContextResponse
	= DTO
	| IExecutable
	| number
	| ((ctx: IContext) => ContextResponse | Promise<ContextResponse>)

export interface IContext<
	UserDTO extends BaseUserDTO = BaseUserDTO,
	UserClass extends IBaseUser<UserDTO> = IBaseUser<UserDTO>,
	LocalsDTO extends KVObject = any,
	Query extends KVObject = any,
	Params extends KVObject = any,
	Body extends KVObject = any
> {
	// parent app
	readonly app: IApp<UserDTO, UserClass, LocalsDTO, IContext<UserDTO, UserClass, LocalsDTO, Query, Params, Body>>
	
	// request headers
	readonly headers: IContextHeaders
	
	// state
	readonly koaCtx: KoaContext
	readonly locals: Partial<LocalsDTO>
	readonly session: Session
	readonly user: UserClass | null
	
	// these should trigger validations
	readonly query: Query
	readonly params: Params
	readonly body: Body
	
	// utilities
	readonly validator: IValidator
	
	// metadata
	readonly isJsonRequest: boolean
	readonly ipAddress: string
	
	initialize(): Promise<void>
	
	respond(data: ContextResponse): Promise<void>
	
	/**
	 * Logs in the user of this context by setting the `userId` key in the session. They are later resolved through
	 * the app's `resolveUser` method. If the user is currently logged in as another user, this will first log them out.
	 */
	login(userId: UserDTO["id"]): Promise<void>
	
	/**
	 * Logs the user out by removing the user ID from the session. This will throw an error if there is no user ID set
	 * in the session.
	 */
	logout(): void
}

export type ContextConstructor<Context extends IContext<any, any, any>> = new (app: IApp, koaCtx: KoaContext) => Context

export abstract class Context<
	UserDTO extends BaseUserDTO,
	UserClass extends IBaseUser<UserDTO>,
	LocalsDTO extends KVObject,
	Query extends KVObject = any,
	Params extends KVObject = any,
	Body extends KVObject = any
> implements IContext<UserDTO, UserClass, LocalsDTO, Query, Params, Body> {
	readonly validator: IValidator = new Validator(this as IContext<any, any, any>)
	
	private isInitialized = false
	private hasProcessedResponse = false
	
	readonly locals: Partial<LocalsDTO> = {}
	
	private _user: UserClass | null = null
	
	readonly wantsHtml = this.koaCtx.accepts("html") !== false
	readonly wantsJson = this.koaCtx.accepts("json") !== false
	readonly isJsonRequest = !this.wantsHtml && this.wantsJson
	private _ipAddress?: string
	
	readonly headers: IContextHeaders
	
	protected constructor(
		readonly app: IApp<
			UserDTO,
			UserClass,
			LocalsDTO,
			IContext<UserDTO, UserClass, LocalsDTO, Query, Params, Body>
		>,
		readonly koaCtx: KoaContext
	) {
		this.headers = new ContextHeaders(this.koaCtx)
	}
	
	get session(): Session {
		const session = this.koaCtx.session
		
		if (!this.app.useSessions) {
			throw new Error(
				"Sessions are disabled. Please provide the `sessionKey` property to enable them, or "
				+ "stop using the `ctx.session` accessor."
			)
		}
		
		if (!session) {
			throw new Error("Session not initialized.")
		}
		
		return session
	}
	
	get user(): UserClass | null {
		return this._user
	}
	
	get query(): Query {
		return this
			.validator
			.get("query") ?? this.koaCtx.query
	}
	
	get params(): Params {
		return this
			.validator
			.get("params") ?? this.koaCtx.params
	}
	
	get body(): Body {
		return this
			.validator
			.get("body") ?? this.koaCtx.request.body
	}
	
	get ipAddress(): string {
		if (!this._ipAddress) {
			// make sure we only allow local ip addresses in development
			this._ipAddress = resolveIpAddressFromIncomingMessage(this.koaCtx.req)
		}
		
		return this._ipAddress
	}
	
	/**
	 * Reads the user ID from the session. If present, calls the app's user resolver, and sets the user property. This
	 * will throw if the application has sessions disabled.
	 */
	private async resolveUser() {
		if (this.app.opts.sessionKey == null) {
			throw new Error("Context: cannot resolve user without sessions enabled.")
		}
		
		if (!this.session.userId) {
			throw new Error("Context: cannot resolve user without a user ID in the session.")
		}
		
		// if this returns false, it means the user was not found
		const resolved = await this.app.opts
			.resolveUser?.(this.session.userId) ?? false
		
		// set the user property if found
		if (resolved !== false) {
			this._user = resolved
		}
	}
	
	async initialize() {
		// ensure context is only initialized once
		if (this.isInitialized) {
			throw new Error("Context already initialized.")
		}
		
		// extract user from session if sessions are enabled and a user ID is set
		if (this.app.opts.sessionKey != null && this.session.userId) {
			await this.resolveUser()
		}
		
		// mark us as initialized
		this.isInitialized = true
	}
	
	async respond(data: ContextResponse | Promise<ContextResponse>): Promise<void> {
		// TODO: allow this to accept a view directly instead of a renderer (i.e. return Todo)
		
		// ensure no responses are sent until the context has been initialized
		if (!this.isInitialized) {
			throw new Error("Context: cannot respond until context has been initialized.")
		}
		
		// ensure this is only ever called once
		if (this.hasProcessedResponse) {
			throw new Error("Context: response has already been processed.")
		}
		
		// if we were not provided any data at all, throw a not implemented error
		if (isNil(data)) {
			throw new HTTPError.NotImplemented()
		}
		
		// if we received a function, unwrap it
		if (isFunction(data)) {
			// FIXME: any, any, any bad
			data = data(this as IContext<any, any>)
		}
		
		// if we have a promise, await it
		data = await data
		
		// if a number is returned, wrap it in a status responder
		if (isNumber(data)) {
			data = new Responder().status(data)
		}
		
		// at this point, we need an executable, so if we don't have one, create one that responds with the data
		if (!isExecutable(data)) {
			const r = new Responder()
			r.send(data)
			
			// if this is a POST request, set the status to 201
			if (this.koaCtx.request.method === "POST") {
				r.status(201)
			}
			
			data = r
		}
		
		try {
			// finally, run the provided executable
			// FIXME: this can't be good practice
			await data.execute(this.app as IApp<any, any, any, any>, this as IContext<any, any>)
		} finally {
			// mark this as processed, so it doesn't get called again
			this.hasProcessedResponse = true
		}
	}
	
	async login(userId: UserDTO["id"]): Promise<void> {
		// log the user out if they aren't already
		if (this.user) {
			this.logout()
		}
		
		// set the ID in the session
		this.session.userId = userId
		
		// resolve the user, so we can immediately use the new user property
		await this.resolveUser()
	}
	
	logout() {
		this.session.userId = null
		this._user = null
	}
}

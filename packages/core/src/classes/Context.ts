import { Context as KoaContext } from "koa"
import { Session } from "koa-session"
import { isFunction, isNil, isNumber } from "lodash-es"
import HTTPError from "http-errors"
import { DTO, KVObject } from "../types"
import { IExecutable, isExecutable } from "./Executable"
import { BaseLocalsDTO, BaseUserDTO } from "../dto"
import { IApp } from "./App"
import { IValidator, Validator } from "./Validator"
import { Responder } from "./Responder"
import { resolveIpAddressFromIncomingMessage } from "../helpers"
import { IBaseUser } from "./User"

export type ContextResponse
	= DTO
	| IExecutable
	| number
	| ((ctx: IContext) => ContextResponse | Promise<ContextResponse>)

export interface IContext<
	UserDTO extends BaseUserDTO = BaseUserDTO,
	UserClass extends IBaseUser<UserDTO> = IBaseUser<UserDTO>,
	LocalsDTO extends BaseLocalsDTO<UserDTO> = BaseLocalsDTO<UserDTO>,
	Query extends KVObject = any,
	Params extends KVObject = any,
	Body extends KVObject = any
> {
	// parent app
	readonly app: IApp<UserDTO, UserClass, LocalsDTO, IContext<UserDTO, UserClass, LocalsDTO, Query, Params, Body>>
	
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
	
	logout(): void
}

export type ContextConstructor<Context extends IContext<any, any, any>> = new (app: IApp, koaCtx: KoaContext) => Context

export abstract class Context<
	UserDTO extends BaseUserDTO,
	UserClass extends IBaseUser<UserDTO>,
	LocalsDTO extends BaseLocalsDTO<UserDTO>,
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
	
	constructor(
		readonly app: IApp<
			UserDTO,
			UserClass,
			LocalsDTO,
			IContext<UserDTO, UserClass, LocalsDTO, Query, Params, Body>
		>,
		readonly koaCtx: KoaContext
	) {
		// ...
	}
	
	get session(): Session {
		const session = this.koaCtx.session
		
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
			this._ipAddress = resolveIpAddressFromIncomingMessage(this.koaCtx.req)
		}
		
		return this._ipAddress
	}
	
	async initialize() {
		// ensure context is only initialized once
		if (this.isInitialized) {
			throw new Error("Context already initialized.")
		}
		
		// extract user from session
		if (this.session.userId) {
			this._user = await this.app.opts
				.resolveUser(this.session.userId)
		}
		
		// mark us as initialized
		this.isInitialized = true
	}
	
	// TODO: type this
	async respond(data: ContextResponse | Promise<ContextResponse>): Promise<void> {
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
			data = data(this as IContext<any, any, any>)
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
			await data.execute(this.app as IApp<any, any, any, any>, this as IContext<any, any, any>)
		} finally {
			// mark this as processed, so it doesn't get called again
			this.hasProcessedResponse = true
		}
	}
	
	logout() {
		this.session.userId = null
		this._user = null
	}
}

import { IncomingHttpHeaders, OutgoingHttpHeader, OutgoingHttpHeaders } from "node:http"
import { Context } from "koa"

/**
 * Represents the headers for a context. This class can be used to read incoming headers, and write outgoing headers.
 */
export interface IContextHeaders {
	/**
	 * The incoming headers.
	 */
	readonly incoming: IncomingHttpHeaders
	
	/**
	 * The outgoing headers.
	 */
	readonly outgoing: OutgoingHttpHeaders
	
	/**
	 * Returns the value of an incoming header
	 */
	get(name: string): string | string[] | null
	
	/**
	 * Returns the value of an outgoing header
	 */
	getOutgoing(name: string): OutgoingHttpHeader | null
	
	/**
	 * Sets the value of an outgoing header
	 */
	set<T extends string>(name: string, value: T | T[]): this
}

export class ContextHeaders implements IContextHeaders {
	readonly incoming: IncomingHttpHeaders = this.ctx.request.headers
	readonly outgoing: OutgoingHttpHeaders = this.ctx.response.headers
	
	constructor(private readonly ctx: Context) {
		// ...
	}
	
	get(name: string): string | string[] | null {
		return this.ctx.request.get(name)
	}
	
	getOutgoing(name: string): OutgoingHttpHeader | null {
		return this.ctx.response.get(name)
	}
	
	set<T extends string>(name: string, value: T | T[]): this {
		this.ctx.response.set(name, value)
		return this
	}
}

import createHttpError from "http-errors"
import { isUndefined } from "lodash-es"
import { Flasher, IFlasher } from "./Flasher"
import { IApp } from "./App"
import { IContext } from "./Context"

export interface IResponder extends IFlasher {
	status(code: number): this
	
	send(data: any): this
	
	setError(): this
}

export class Responder extends Flasher implements IResponder {
	private statusCode?: number
	private response?: any
	private isError = false
	
	status(code: number): this {
		if (this.statusCode) {
			throw new Error("Cannot set the status code twice")
		}
		
		this.statusCode = code
		return this
	}
	
	send(data: any): this {
		this.response = data
		return this
	}
	
	setError(): this {
		this.isError = true
		return this
	}
	
	override async execute(app: IApp, ctx: IContext): Promise<void> {
		// apply flash messages
		await super.execute(app, ctx)
		
		// process status code if present
		if (this.statusCode) {
			// apply status code to response
			ctx.koaCtx.status = this.statusCode
			
			// in the case of an error with status >= 400, throw the relevant error
			if (!this.isError && ctx.koaCtx.status >= 400) {
				throw createHttpError(ctx.koaCtx.status)
			}
		}
		
		// add response if present
		if (!isUndefined(this.response)) {
			ctx.koaCtx.body = this.response
		}
	}
}

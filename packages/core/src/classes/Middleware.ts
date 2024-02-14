import { isNil } from "lodash-es"
import { IContext } from "./Context"
import { IApp } from "./App"

export interface IMiddleware {
	readonly app: IApp
	
	execute(ctx: IContext): Promise<boolean>
}

export type MiddlewareConstructor = new (app: IApp) => IMiddleware

export abstract class Middleware implements IMiddleware {
	constructor(public readonly app: IApp) {
		// ...
	}
	
	protected abstract run(ctx: IContext): any
	
	async execute(ctx: IContext) {
		const result = await this.run(ctx)
		
		if (!isNil(result)) {
			await ctx.respond(result)
			return false
		}
		
		return true
	}
}

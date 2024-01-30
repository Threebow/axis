import { isNil } from "lodash-es"
import { IContext } from "@/classes/Context"

export type MiddlewareConstructor = new () => Middleware

export abstract class Middleware {
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

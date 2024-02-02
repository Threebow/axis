import { Middleware } from "../../../../classes"
import { CustomContext } from "../../context"

export class CustomMiddleware extends Middleware {
	async run(ctx: CustomContext): Promise<void> {
		// console.log("Middleware hit!", ctx.koaCtx.url)
	}
}

import { Middleware } from "../../../../classes"
import { CustomContext } from "../../context"

export class CustomMiddleware extends Middleware {
	protected async run(ctx: CustomContext): Promise<void> {
		if (this.app.useSessions) {
			ctx.session.CustomMiddlewareExecuted = true
		}
	}
}

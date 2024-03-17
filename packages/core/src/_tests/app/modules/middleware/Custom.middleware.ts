import { Middleware } from "../../../../classes"
import { CustomContext } from "../../context"

export const MOCK_LINKS = [
	{ name: "Home", href: "/" },
	{ name: "About", href: "/about" },
	{ name: "Contact", href: "/contact" }
]

export class CustomMiddleware extends Middleware {
	protected async run(ctx: CustomContext): Promise<void> {
		if (this.app.useSessions) {
			ctx.session.CustomMiddlewareExecuted = true
		}
	}
}

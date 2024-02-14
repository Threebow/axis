import { Controller } from "../../../../classes"
import { Get, Mount } from "../../../../decorators"
import { ANestedLayoutsController } from "./A/A.NestedLayouts.controller"
import { CustomContext } from "../../context"

@Mount("/a", ANestedLayoutsController)
export class NestedLayoutsController extends Controller {
	@Get("/test-middleware")
	testMiddleware(ctx: CustomContext) {
		return {
			called: ctx.session.CustomMiddlewareExecuted
		}
	}
}

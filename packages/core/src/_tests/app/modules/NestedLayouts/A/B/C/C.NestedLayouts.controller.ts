import { Controller } from "../../../../../../../classes"
import NestedTest from "./NestedTest.vue"
import { Get } from "../../../../../../../decorators"
import { render } from "../../../../../../../helpers/backend"
import { CustomContext } from "../../../../../context"

export class CNestedLayoutsController extends Controller {
	@Get("/")
	show() {
		return render(NestedTest)
	}
	
	@Get("/test-middleware")
	testMiddleware(ctx: CustomContext) {
		return {
			called: ctx.session.CustomMiddlewareExecuted
		}
	}
}

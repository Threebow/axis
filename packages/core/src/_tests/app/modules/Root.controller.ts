import { CustomMiddleware } from "../middleware/Custom.middleware"
import { TodosController } from "./Todo/Todo.controller"
import { Delete, Get, Mount, Patch, Post, Query, Use } from "../../../decorators"
import { Controller } from "../../../classes"
import { CustomContext } from "../context"
import { RootIndexDTO } from "./Root.dto"
import Root from "./Root.vue"
import { z } from "zod"
import { NestedLayoutsController } from "./NestedLayouts/NestedLayouts.controller"
import { render } from "../../../helpers/backend"
import { GuardTestController } from "./GuardTest/GuardTest.controller"

@Use(CustomMiddleware)
@Mount("/todos", TodosController)
@Mount("nested-layouts", NestedLayoutsController)
@Mount("guard-test", GuardTestController)
export class RootController extends Controller {
	@Get()
	index() {
		return "Hello world!"
	}
	
	@Get("/page")
	@Query({
		uuid: z.string().uuid()
	})
	page(ctx: CustomContext) {
		return render<RootIndexDTO>(Root, {
			uuid: ctx.query.uuid
		})
	}
	
	@Post("/create-test")
	store() {
		return 201
	}
	
	@Patch("echo/:a/:b/:c")
	echo(ctx: CustomContext) {
		return {
			params: ctx.params,
			query: ctx.query,
			body: ctx.body,
			headers: ctx.koaCtx.headers
		}
	}
	
	@Delete("/unimplemented")
	unimplemented() {
		// returns nothing on purpose
	}
	
	@Get("/test-middleware")
	testMiddleware(ctx: CustomContext) {
		return {
			// this value is set by middleware
			called: ctx.session.CustomMiddlewareExecuted
		}
	}
	
	@Get("test-headers")
	@Query({
		n: z.coerce.number()
	})
	testHeaders(ctx: CustomContext) {
		ctx.headers.set("X-TeSt-oUtPuT", ctx.query.n)
		
		return {
			incoming: ctx.headers.incoming,
			outgoing: ctx.headers.outgoing,
			input: ctx.headers.get("X-tEsT-InPuT"),
			output: ctx.headers.getOutgoing("x-test-output")
		}
	}
}

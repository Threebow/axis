import { CustomMiddleware } from "./middleware/Custom.middleware"
import { TodosController } from "./Todo/Todo.controller"
import { Delete, Get, Mount, Patch, Post, Query, Use } from "../../../decorators"
import { Controller } from "../../../classes"
import { CustomContext } from "../context"
import { RootIndexDTO } from "./Root.dto"
import { render } from "../../../helpers"
import Root from "./Root.vue"
import { z } from "zod"
import { NestedLayoutsController } from "./NestedLayouts/NestedLayouts.controller"

@Use(CustomMiddleware)
@Mount("/todos", TodosController)
@Mount("/nested-layouts", NestedLayoutsController)
export class RootController extends Controller {
	@Get("/")
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
	
	@Patch("/echo/:a/:b/:c")
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
}

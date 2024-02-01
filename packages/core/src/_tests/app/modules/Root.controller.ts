import { CustomMiddleware } from "./middleware/Custom.middleware"
import { TodosController } from "./Todo/Todo.controller"
import { Delete, Get, Mount, Patch, Post, Use } from "../../../decorators"
import { Controller } from "../../../classes"
import { CustomContext } from "../context"

@Use(CustomMiddleware)
@Mount("/todos", TodosController)
export class RootController extends Controller {
	@Get("/")
	index() {
		return "Hello world!"
	}
	
	@Get("/page")
	async page() {
		// TODO: test render without correct props or type passed, should throw a constructive error
		
		// const filename = "Root.vue"
		// const source = await readFile(fileURLToPath(import.meta.resolve("./" + filename)).replace("dist", "src"), "utf8")
		
		// const r = compileTemplate({
		// 	source,
		// 	filename,
		// 	id: "hello? id?"
		// })
		
		// console.log(source)
		// console.log("!!!!!!!!!!!!!")
		
		// (n as any).__FILENAME__ = "Root.vue"
		
		// console.log("hello", n)
		
		// return render<RootIndexDTO>(null, {
		// 	num: 42,
		// 	str: "Hello world!",
		// 	arr: [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n],
		// 	date: new Date()
		// })
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

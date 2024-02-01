import { z } from "zod"
import { v4 } from "uuid"
import { Controller } from "../../../../classes"
import { MOCK_TODOS, TodoDTO } from "./Todo.dto"
import { Body, Get, Post, Query, Use } from "../../../../decorators"
import { CustomContext } from "../../context"
import { sleep } from "../../../../helpers"
import { CustomMiddleware } from "../middleware/Custom.middleware"

export class TodosController extends Controller {
	// this simulates a data source for our test
	private readonly data: TodoDTO[] = [...MOCK_TODOS]
	
	@Get("/")
	@Query({
		q: z.string().trim().min(1).toLowerCase().optional()
	})
	async index(ctx: CustomContext): Promise<TodoDTO[]> {
		await sleep(10)
		
		return ctx.query.q
			? this.data.filter((t) => t.title.toLowerCase().includes(ctx.query.q))
			: this.data
	}
	
	@Post("/")
	@Body({
		title: z.string().min(1).max(100)
	})
	@Use(CustomMiddleware)
	async store(ctx: CustomContext): Promise<TodoDTO> {
		const newTodo: TodoDTO = {
			id: v4(),
			title: ctx.body.title,
			completed: false
		}
		
		await sleep(10)
		this.data.push(newTodo)
		
		return newTodo
	}
	
	// TODO: implement and test destroy route
}

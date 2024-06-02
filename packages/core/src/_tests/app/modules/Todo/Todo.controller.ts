import { z } from "zod"
import { v4 } from "uuid"
import { Controller } from "../../../../classes"
import { MOCK_TODOS, TodoDTO } from "./Todo.dto"
import { Body, Get, Params, Post, Query, Use } from "../../../../decorators"
import { CustomContext } from "../../context"
import { sleep } from "../../../../helpers"
import { CustomMiddleware } from "../../middleware/Custom.middleware"
import { json } from "../../../../helpers/backend"
import { IJsonResponder } from "../../../../classes/JsonResponder"

export class TodosController extends Controller {
	// this simulates a data source for our test
	private readonly data: TodoDTO[] = [...MOCK_TODOS]
	
	@Get("/")
	@Query({
		q: z.string().trim().min(1).toLowerCase().optional()
	})
	async index(ctx: CustomContext): Promise<IJsonResponder<TodoDTO[]>> {
		// simulate data access
		await sleep(10)
		
		const todos = ctx.query.q
			? this.data.filter((t) => t.title.toLowerCase().includes(ctx.query.q))
			: this.data
		
		return json(todos)
	}
	
	@Get("/:id")
	@Params({
		id: z.string().uuid()
	})
	async show(ctx: CustomContext): Promise<IJsonResponder<TodoDTO> | 404> {
		// simulate data access
		await sleep(10)
		
		const r = this.data
			.find((t) => t.id === ctx.params.id)
		
		return r ? json(r) : 404
	}
	
	@Post("/")
	@Body({
		title: z.string().min(1).max(100)
	})
	@Use(CustomMiddleware)
	async store(ctx: CustomContext): Promise<IJsonResponder<TodoDTO>> {
		const newTodo: TodoDTO = {
			id: v4(),
			title: ctx.body.title,
			completed: false,
			createdAt: new Date()
		}
		
		await sleep(10)
		this.data.push(newTodo)
		
		return json(newTodo)
			.status(201)
	}
	
	// TODO: implement and test destroy route
}

import { assert, expect, use as chaiUse } from "chai"
import chaiUuid from "chai-uuid"
import chaiString from "chai-string"
import { restore, stub } from "sinon"
import { createMockApp } from "./app"
import { createRequester } from "../helpers"
import { MOCK_TODOS } from "./app/modules/Todo/Todo.dto"

chaiUse(chaiUuid)
chaiUse(chaiString)

describe("Application", () => {
	describe("Boot and shutdown", () => {
		const app = createMockApp()
		
		it("should boot on the correct host and port", async () => {
			const { host, port } = await app.boot()
			expect(host).to.equal("0.0.0.0")
			expect(port).to.equal(3000)
		})
		
		it("should shut down gracefully", () => app.shutdown())
	})
	
	describe("Root Controller", () => {
		const app = createMockApp()
		
		const r = createRequester({ baseURL: "http://localhost:3000" })
		
		before(() => app.boot())
		
		it("should respond to a health check", async () => {
			const res = await r("GET", "/health-check")
			
			// deep equal res object
			expect(res).to.deep.equal({
				success: true,
				status: 200,
				data: "OK"
			})
		})
		
		it("should return hello world from the index route", async () => {
			const res = await r("GET", "/")
			
			expect(res).to.deep.equal({
				success: true,
				status: 200,
				data: "Hello world!"
			})
		})
		
		// it("should return the correct rendered view from the page route", async () => {
		// 	const res = await r("GET", "/page")
		//
		// 	console.log("!!!", res)
		//
		// 	expect(res).to.deep.equal({
		// 		success: true,
		// 		status: 200,
		// 		data: "<!DOCTYPE html><html><head><title>Test Page</title></head><body><h1>Test Page</h1><p>This is a test page.</p></body></html>"
		// 	})
		// })
		
		it("should return 201 from the store route", async () => {
			const res = await r("POST", "/create-test")
			
			// @ts-ignore
			expect(res).to.deep.equal({
				success: true,
				status: 201,
				data: "Created"
			})
		})
		
		it("should echo back our request query, params, body, and headers", async () => {
			const testKey = "X-Test".toLowerCase()
			const testValue = "Hello world!"
			
			const res = await r("PATCH", "/echo/1/2/3", {
				a: "Hello"
			}, {
				b: "World"
			}, {
				headers: {
					[testKey]: testValue
				}
			})
			
			assert(res.success)
			expect(res.status).to.equal(200)
			expect(res.data).to.be.a("object")
			expect(res.data.params).to.deep.equal({
				a: "1",
				b: "2",
				c: "3"
			})
			expect(res.data.query).to.deep.equal({
				b: "World"
			})
			expect(res.data.body).to.deep.equal({
				a: "Hello"
			})
			
			expect(res.data.headers).to.be.a("object")
			expect(res.data.headers[testKey]).to.equal(testValue)
		})
		
		it("should return a non-implemented error if a route is not implemented", async () => {
			stub(console, "error")
			
			const res = await r("DELETE", "/unimplemented")
			
			assert(!res.success)
			expect(res.data.status).to.equal(501)
			expect(res.data.eventId).to.be.a("string").with.length(32)
			expect(res.data.extra).to.equal("Not Implemented")
			
			expect(console.error).to.have.been.calledWith("Event ID:")
		})
		
		it("should return a method not allowed response if the wrong method is used on a route", async () => {
			const res = await r("GET", "/create-test")
			
			assert(!res.success)
			expect(res.data.status).to.equal(405)
			expect(res.data.extra).to.equal("Method Not Allowed")
		})
		
		describe("Todo Controller", () => {
			it("should return the correct todos", async () => {
				const res = await r("GET", "/todos")
				
				expect(res).to.deep.equal({
					success: true,
					status: 200,
					data: MOCK_TODOS
				})
			})
			
			let todoId: string | null = null
			
			it("should create and return a new todo", async () => {
				const res = await r("POST", "/todos", { title: "Buy cheese" })
				
				assert(res.success)
				expect(res.status).to.equal(201)
				expect(res.data).to.have.keys("id", "title", "completed")
				expect(res.data.id).to.be.a.uuid("v4")
				expect(res.data.title).to.equal("Buy cheese")
				expect(res.data.completed).to.equal(false)
				
				todoId = res.data.id
			})
			
			it("should return the new list of todos", async () => {
				const res = await r("GET", "/todos")
				
				expect(res).to.deep.equal({
					success: true,
					status: 200,
					data: [
						...MOCK_TODOS,
						{
							id: todoId,
							title: "Buy cheese",
							completed: false
						}
					]
				})
			})
			
			it("should return a validation error if provided an invalid body", async () => {
				stub(console, "error")
				
				// TODO: extend to support sentry with simple helpers like .to.be.an.eventId()
				
				const res = await r("POST", "/todos", { title: -1 })
				
				assert(!res.success)
				expect(res.data).to.have.keys("status", "eventId", "extra")
				expect(res.data.status).to.equal(400)
				expect(res.data.eventId).to.be.a("string").with.length(32)
				expect(res.data.extra).to.equal("Validation error: Expected string, received number at \"title\"")
				
				expect(console.error).to.have.been.calledWith("Event ID:")
			})
		})
		
		afterEach(() => restore())
		
		after(() => app.shutdown())
	})
})


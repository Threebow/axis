import { assert, expect } from "chai"
import { restore, stub } from "sinon"
import { uuid } from "../helpers"
import {
	buildStringFromStubCalls,
	createMockApp,
	createMockRequester,
	expectToIncludeInOrder
} from "../_tests/fixtures"
import { MOCK_TODOS } from "../_tests/app/modules/Todo/Todo.dto"

describe("Application", () => {
	describe("Boot", () => {
		const app = createMockApp({ addFixtures: false })
		
		it("should boot on the provided host and port", async () => {
			app.opts.host = "127.0.0.1"
			app.opts.port = 8080
			
			const { host, port } = await app.boot()
			expect(host).to.equal("127.0.0.1")
			expect(port).to.equal(8080)
		})
		
		it("should boot on the default host and port if neither are provided", async () => {
			delete app.opts.host
			delete app.opts.port
			
			const { host, port } = await app.boot()
			expect(host).to.equal("0.0.0.0")
			expect(port).to.equal(3000)
		})
		
		afterEach(() => app.shutdown())
	})
	
	describe("Shutdown", () => {
		const app = createMockApp({ addFixtures: false })
		
		beforeEach(() => app.boot())
		
		it("should shut down gracefully", () => app.shutdown())
		
		it("should throw an error if the app is shut down more than once", async () => {
			await app.shutdown()
			await assert.isRejected(app.shutdown(), "Server is not running.")
		})
	})
	
	describe("Health Check", () => {
		const test = { id: uuid() }
		
		createMockApp({ healthCheckData: test })
		
		const r = createMockRequester()
		
		it("should respond to a health check with the correct data", async () => {
			const res = await r("GET", "/health-check")
			
			// deep equal res object
			expect(res).to.deep.equal({
				success: true,
				status: 200,
				data: test
			})
		})
	})
	
	describe("Logging", () => {
		createMockApp({ loggingEnabled: true })
		
		const r = createMockRequester()
		
		it("should log requests if logging is enabled", async () => {
			const logs = buildStringFromStubCalls(
				stub(process.stdout, "write")
			)
			
			await r("GET", "/health-check")
			
			expect(logs.content).to.startWith("GET /health-check 200")
		})
		
		afterEach(() => restore())
	})
	
	describe("Body Parser Settings", () => {
		const body = {
			data: "0".repeat(2_000_000)
		}
		
		describe("Sensible Defaults", () => {
			createMockApp()
			
			const r = createMockRequester()
			
			it("should return 413 when passed a large request", async () => {
				const res = await r("PATCH", "/echo/1/2/3", body)
				
				assert(!res.success)
				expect(res.data.status).to.equal(413)
			})
		})
		
		describe("Enlarged JSON limit", () => {
			createMockApp({
				bodyParserOptions: {
					jsonLimit: "3mb"
				}
			})
			
			const r = createMockRequester()
			
			it("should allow large requests when configured correctly", async () => {
				const res = await r("PATCH", "/echo/1/2/3", body)
				
				assert(res.success)
				expect(res.status).to.equal(200)
				expect(res.data.body).to.deep.equal(body)
			})
		})
	})
	
	describe("Custom Error Handlers", () => {
		const NUM_HANDLERS = 3
		
		createMockApp({
			errorHandlers: Array
				.from({ length: NUM_HANDLERS })
				.map((_, i) => {
					return async (ctx, next) => {
						console.warn("H" + i)
						
						try {
							await next()
						} catch (e: any) {
							ctx.status = 422
							ctx.body = `H${i}: ${e.message}`
						}
					}
				})
		})
		
		const r = createMockRequester()
		
		it("should call defined custom error handlers in the correct order", async () => {
			const logs = buildStringFromStubCalls(
				stub(console, "warn")
			)
			
			const res = await r("DELETE", "/unimplemented")
			
			assert(!res.success)
			
			const match = Array
				.from({ length: NUM_HANDLERS })
				.map((_, i) => "H" + i)
			
			expectToIncludeInOrder(logs.content, match)
			expect(res.data).to.equal(`H${match.length - 1}: Not Implemented`)
		})
		
		afterEach(() => restore())
	})
	
	describe("Root Controller", () => {
		createMockApp()
		
		const r = createMockRequester()
		
		it("should return hello world from the index route", async () => {
			const res = await r("GET", "/")
			
			expect(res).to.deep.equal({
				success: true,
				status: 200,
				data: "Hello world!"
			})
		})
		
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
			expect(res.data).to.not.have.key("extra")
			
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
				const res = await r("POST", "/todos", { title: -1 })
				
				assert(!res.success)
				
				expect(res.data).to.deep.equal({
					status: 422,
					extra: "Validation error: Expected string, received number at \"title\""
				})
			})
		})
		
		afterEach(() => restore())
	})
})


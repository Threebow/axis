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
import HTTPError from "http-errors"
import { AppErrorType, isAppError } from "./AppError"
import { KVObject } from "../types"

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
	
	describe("Headers", () => {
		createMockApp()
		
		const r = createMockRequester()
		
		it("should expose the correct headers", async () => {
			const testInput = uuid()
			const testN = Math.random()
			
			const data = await r(
				"GET",
				"/test-headers",
				{},
				{ n: testN },
				{
					headers: {
						// inconsistent capitalization on purpose
						"X-test-inpuT": testInput
					}
				}
			)
			
			assert(data.success)
			expect(data.status).to.equal(200)
			expect(data.data.incoming.accept).to.equal("application/json")
			expect(data.data.incoming["content-type"]).to.equal("application/json")
			expect(data.data.incoming["x-test-input"]).to.equal(testInput)
			expect(data.data.input).to.equal(testInput)
			expect(data.data.output).to.equal(testN.toString())
		})
	})
	
	describe("Named Routes", () => {
		const app = createMockApp()
		
		it("should throw an app error if the route does not exist", () => {
			const tests: string[] = [
				"this.route.does.not.exist",
				"todos.destroy",
				"nestedLayouts.a.coolerTest"
			]
			
			for (const test of tests) {
				let err
				
				try {
					app.resolveRouteFullPath(test)
				} catch (e) {
					err = e
				}
				
				assert(isAppError(err), "Expected app error")
				expect(err.type).to.eq(AppErrorType.INVALID_ROUTE)
				expect(err.message).to.include(`"${test}"`)
			}
		})
		
		it("should resolve routes from route names", () => {
			type CoolTest = {
				input: string,
				expectedOutput: string
			}
			
			const tests: CoolTest[] = [
				{
					input: "index",
					expectedOutput: "/"
				},
				{
					input: "testMiddleware",
					expectedOutput: "/test-middleware"
				},
				{
					input: "todos.index",
					expectedOutput: "/todos"
				},
				{
					input: "todos.show",
					expectedOutput: "/todos/:id"
				},
				{
					input: "todos.store",
					expectedOutput: "/todos"
				},
				{
					input: "nestedLayouts.a.coolTest",
					expectedOutput: "/nested-layouts/a/cool-test"
				},
				{
					input: "nestedLayouts.a.customB.c.testMiddleware",
					expectedOutput: "/nested-layouts/a/b/c/test-middleware"
				},
				{
					input: "nestedLayouts.a.customB.someMethod",
					expectedOutput: "/nested-layouts/a/b/some-method"
				},
				{
					input: "nestedLayouts.a2.customB.someMethod",
					expectedOutput: "/nested-layouts/a2/b/some-method"
				},
				{
					input: "echo",
					expectedOutput: "/echo/:a/:b/:c"
				},
				{
					input: "guardTest.nested.deep.test",
					expectedOutput: "/guard-test/nested/deep/test"
				}
			]
			
			for (const test of tests) {
				const resolved = app.resolveRouteFullPath(test.input)
				expect(resolved).to.equal(test.expectedOutput)
			}
		})
		
		it("should fill in route parameters", () => {
			type CoolTest = {
				input: {
					route: string
					params: KVObject
				}
				expectedOutput: (params?: KVObject) => string
			}
			
			const tests: CoolTest[] = [
				{
					input: {
						route: "todos.show",
						params: { id: uuid() }
					},
					expectedOutput: (p) => `/todos/${p!.id}`
				},
				{
					input: {
						route: "echo",
						params: { a: 1, b: "2", c: "something" }
					},
					expectedOutput: () => `/echo/1/2/something`
				}
			]
			
			for (const { input: { route, params }, expectedOutput } of tests) {
				const resolved = app.resolveRouteFullPath(route, params)
				expect(resolved).to.equal(expectedOutput(params))
			}
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
					return async (_, next) => {
						console.warn("H" + i)
						
						try {
							await next()
						} catch (e: any) {
							throw new HTTPError.UnavailableForLegalReasons(`H${i}: ${e.message}`)
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
			
			// assert log order
			const match = Array
				.from({ length: NUM_HANDLERS })
				.map((_, i) => "H" + i)
			
			expectToIncludeInOrder(logs.content, match)
			
			// assert response state
			assert(!res.success)
			expect(res.data.status).to.equal(451)
			expect(res.data.extra).to.equal(`${match.join(": ")}: Not Implemented`)
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

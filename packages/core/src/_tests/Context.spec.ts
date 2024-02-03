import { assert, expect } from "chai"
import { createMockAppWithContext } from "./fixtures/createMockAppWithContext.fixture"
import { MOCK_USERS } from "./app/classes/User.class"
import { sample } from "lodash-es"
import { redirect, status } from "../helpers/backend"

describe("Context", () => {
	describe("Initialization", () => {
		const mock = createMockAppWithContext()
		
		it("should not allow re-initialization", () => {
			return assert.isRejected(mock.ctx.initialize(), "Context already initialized.")
		})
	})
	
	describe("Session", () => {
		const mock = createMockAppWithContext()
		
		it("should have an accessible session", () => {
			expect(mock.ctx.session).to.be.an("object")
		})
		
		it("should throw an error if the session is not initialized when accessed", () => {
			mock.ctx.koaCtx.session = null
			return expect(() => mock.ctx.session).to.throw("Session not initialized.")
		})
		
		it("should not load a user", () => {
			expect(mock.ctx.user).to.be.null
		})
	})
	
	describe("Authentication", () => {
		const testUser = sample(MOCK_USERS)!
		
		const mock = createMockAppWithContext({
			sessionData: {
				userId: testUser.id
			}
		})
		
		it("should load the correct user", () => {
			expect(mock.ctx.user).to.equal(testUser)
		})
		
		it("should log the user out", () => {
			mock.ctx.logout()
			expect(mock.ctx.user).to.be.null
		})
	})
	
	describe("IP Address", () => {
		const mock = createMockAppWithContext({
			headers: {
				["do-connecting-ip"]: "8.8.8.8"
			}
		})
		
		it("should expose the client's ip address", () => {
			expect(mock.ctx.ipAddress).to.equal("8.8.8.8")
		})
	})
	
	describe("Responses", () => {
		describe("Context", () => {
			const mock = createMockAppWithContext({
				dontInitialize: true
			})
			
			it("should not allow responding until the context has been initialized", () => {
				return assert.isRejected(
					mock.ctx.respond(status(201)),
					"Context: cannot respond until context has been initialized."
				)
			})
			
			it("should not allow the context to have processed a response more than once", async () => {
				await mock.ctx.initialize()
				await mock.ctx.respond(status(201))
				await assert.isRejected(mock.ctx.respond(status(204)), "Context: response has already been processed.")
				expect(mock.ctx.koaCtx.status).to.equal(201)
			})
		})
		
		describe("Should be applied correctly to the internal Koa context", () => {
			const mock = createMockAppWithContext()
			
			it("when given a status directly", async () => {
				await mock.ctx.respond(204)
				expect(mock.ctx.koaCtx.status).to.equal(204)
			})
			
			it("when given a redirect", async () => {
				await mock.ctx.respond(redirect("/new-location"))
				expect(mock.ctx.koaCtx.status).to.equal(302)
				expect(mock.ctx.koaCtx.response.headers.location).to.equal("/new-location")
			})
			
			it("when given a function", async () => {
				await mock.ctx.respond(() => 204)
				expect(mock.ctx.koaCtx.status).to.equal(204)
			})
			
			it("when given a promise", async () => {
				await mock.ctx.respond(Promise.resolve(204))
				expect(mock.ctx.koaCtx.status).to.equal(204)
			})
		})
	})
})

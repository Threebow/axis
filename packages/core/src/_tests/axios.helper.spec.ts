import { assert, expect } from "chai"
import { createMockApp } from "./app"
import { createRequester } from "../helpers"
import { MOCK_TODOS } from "./app/modules/Todo/Todo.dto"

describe("Axios helper", () => {
	const app = createMockApp()
	
	before(() => app.boot())
	
	const r = createRequester({ baseURL: "http://localhost:3000" })
	
	it("should return the correct properties on a successful request", async () => {
		const res = await r("GET", "/todos")
		
		assert(res.success)
		expect(res.status).to.equal(200)
		expect(res.data).to.deep.equal(MOCK_TODOS)
	})
	
	it("should error appropriately on a failed request", async () => {
		const res = await r("GET", "/non-existent")
		
		assert(!res.success)
		expect(res.data).to.deep.equal({
			status: 404,
			extra: "Not Found"
		})
	})
	
	it("should make requests with the correct headers", async () => {
		const res = await r("PATCH", "/echo/4/5/6")
		
		assert(res.success)
		
		expect(res.data.headers["accept"]).to.equal("application/json")
		expect(res.data.headers["content-type"]).to.equal("application/json")
	})
	
	after(() => app.shutdown())
})

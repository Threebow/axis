import { expect } from "chai"
import { RequestResult } from "../helpers"
import { createMockApp, createMockRequester } from "../_tests/fixtures"

describe("Middleware", () => {
	createMockApp({ useSession: true })
	
	const r = createMockRequester()
	
	function expectCalled(res: RequestResult) {
		expect(res).to.deep.equal({
			success: true,
			status: 200,
			data: {
				called: true
			}
		})
	}
	
	it("should be executed when defined on a controller and a method on the same controller is hit", async () => {
		const res = await r("GET", "/test-middleware")
		expectCalled(res)
	})
	
	it("should be executed when defined on a parent controller and a method on a child controller is hit", async () => {
		const res = await r("GET", "/nested-layouts/test-middleware")
		expectCalled(res)
	})
	
	it("should be executed when defined on a parent controller and deeply nested controller method is hit", async () => {
		const res = await r("GET", "/nested-layouts/a/b/c/test-middleware")
		expectCalled(res)
	})
})

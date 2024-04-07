import { createMockApp, createMockRequester } from "../_tests/fixtures"
import { assert, expect } from "chai"

describe("Guards", () => {
	createMockApp({ useSession: true })
	
	const r = createMockRequester()
	
	it("should prevent access if the defined guard returns false", async () => {
		const res = await r("GET", "/guard-test")
		assert(!res.success, "expected request to fail")
		expect(res.data.status).to.equal(401)
	})
	
	it("should prevent access to a nested route if the defined guard returns false", async () => {
		const res = await r("GET", "/guard-test/nested/deep/test")
		assert(!res.success, "expected request to fail")
		expect(res.data.status).to.equal(401)
	})
})

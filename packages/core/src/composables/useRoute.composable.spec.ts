import { expect } from "chai"
import { createMockApp, createMockRequester } from "../_tests/fixtures"

describe("useRoute()", () => {
	createMockApp({ useRenderer: true })
	
	const r = createMockRequester()
	
	it("should return the correct route", async () => {
		const data = await r("GET", "/nested-layouts/a/b/c/test-use-route")
		
		expect(data.data).to.be.a("string")
		
		expect(data.data).to.include(`<p class="route-wrapper">nestedLayouts.a.customB.c.testUseRoute</p>`)
	})
})

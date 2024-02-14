import { retry } from "../helpers"
import { assert, expect } from "chai"

describe("Retry helper", () => {
	it("should retry a function until it succeeds", async () => {
		let attempts = 0
		
		const res = await retry(
			() => {
				attempts++
				return "Test success"
			},
			
			() => true
		)
		
		expect(res).to.equal("Test success")
		expect(attempts).to.equal(1)
	})
	
	it("should throw an error if the maximum number of attempts is reached", async () => {
		let attempts = 0
		
		await assert.isRejected(
			retry(
				() => {
					attempts++
					throw new Error("Test error")
				},
				
				() => true,
				
				{ delay: 1, maxAttempts: 3 }
			),
			"Retry failed after 3 attempts."
		)
		
		expect(attempts).to.equal(3)
	})
	
	it("should throw an error if the error test returns false", async () => {
		return assert.isRejected(
			retry(
				() => {
					throw new Error("Test error")
				},
				
				() => false
			),
			"Test error"
		)
	})
})

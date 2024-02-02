import { Listener } from "../stdlib"
import { sleep } from "../helpers"
import { restore, stub } from "sinon"
import { expect } from "chai"

describe("Listener", () => {
	type TestType = {
		a: string
		b: number
	}
	
	class TestListener extends Listener<TestType> {
		test(input: TestType) {
			this.trigger(input)
		}
	}
	
	it("should allow listeners to be added and be called", async () => {
		const input: TestType = {
			a: "hello",
			b: 123
		}
		
		const listener = new TestListener()
		
		const result = await new Promise((resolve) => {
			listener.on(resolve)
			listener.test(input)
		})
		
		expect(result).to.deep.equal(input)
	})
	
	it("should exit cleanly and log an eventId to stderr if a handler throws an error", async () => {
		stub(process, "exit")
		stub(console, "error")
		
		const input: TestType = {
			a: "hello",
			b: 123
		}
		
		const listener = new TestListener()
		
		listener.on(() => {
			throw new Error("test")
		})
		
		listener.test(input)
		
		await sleep(50)
		
		expect(process.exit).to.have.been.called
		expect(console.error).to.have.been.calledWith("Event ID:")
	})
	
	afterEach(() => restore())
})

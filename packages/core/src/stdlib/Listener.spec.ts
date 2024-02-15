import { Listener } from "../stdlib"
import { sleep } from "../helpers"
import { restore, stub } from "sinon"
import { expect } from "chai"
import { DateTime } from "luxon"

describe("Listener", () => {
	type TestType = {
		a: string
		b: number
	}
	
	class TestListener extends Listener<TestType> {
		constructor() {
			super("Test Listener")
		}
		
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
	
	it("should log the listener name, time, and eventId to stderr and exit cleanly if a handler throws an error", async () => {
		let errors = ""
		
		stub(process, "exit")
		stub(console, "error").callsFake((...args: any[]) => errors += args.join("\n") + "\n")
		
		const input: TestType = {
			a: "hello",
			b: 123
		}
		
		const listener = new TestListener()
		
		let time
		
		listener.on(() => {
			time = DateTime.now().toLocaleString(DateTime.DATETIME_HUGE_WITH_SECONDS)
			throw new Error("test")
		})
		
		listener.test(input)
		
		await sleep(50)
		
		expect(time).to.be.a("string")
		expect(process.exit).to.have.been.called
		expect(errors).to.include("ERROR:\nlistener: Test Listener")
		expect(errors).to.include("Event ID:")
		expect(errors).to.include(time)
	})
	
	afterEach(() => restore())
})

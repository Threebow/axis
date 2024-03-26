import { Listener } from "../stdlib"
import { sleep } from "../helpers"
import { restore, stub } from "sinon"
import { assert, expect } from "chai"
import { DateTime } from "luxon"
import { buildStringFromStubCalls } from "../_tests/fixtures"

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
		
		testAsync(input: TestType) {
			return this.triggerAsync(input)
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
		stub(process, "exit")
		
		const errors = buildStringFromStubCalls(
			stub(console, "error")
		)
		
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
		expect(errors.content).to.include("ERROR:\nlistener: Test Listener")
		expect(errors.content).to.include("Event ID:")
		expect(errors.content).to.include(time)
	})
	
	it("should call a guard function and trigger the listener if the guard returns true", async () => {
		const input: TestType = {
			a: "hello",
			b: 123
		}
		
		const listener = new TestListener()
		
		let guardCalled = false
		
		// assignment returns true
		listener.guard(() => guardCalled = true)
		
		const result = await new Promise((resolve) => {
			listener.on(resolve)
			listener.test(input)
		})
		
		assert(guardCalled, "guard function was not called")
		expect(result).to.deep.equal(input)
	})
	
	it("should call a guard function and not trigger the listener if the guard returns false", async () => {
		const input: TestType = {
			a: "hello",
			b: 123
		}
		
		const listener = new TestListener()
		
		let guardCalled = false
		
		// assignment returns true
		listener.guard(() => {
			guardCalled = true
			return false
		})
		
		await new Promise<void>(async (resolve, reject) => {
			listener.on(() => reject(new Error("Listener was triggered")))
			
			await listener.testAsync(input)
			
			// wait short while for event to be triggered
			await sleep(50)
			
			resolve()
		})
		
		assert(guardCalled, "guard function was not called")
	})
	
	afterEach(() => restore())
})

import { PeriodListener } from "../stdlib"
import { expect } from "chai"

describe("PeriodListener", () => {
	function createMockPeriodListener(interval: number) {
		return new PeriodListener("Test Period Listener", interval)
	}
	
	it("should be called 5 times at intervals of about 100ms and stop on request", () => {
		const target = 5
		const interval = 100
		const tolerance = 0.2
		
		return new Promise<void>((resolve) => {
			const listener = createMockPeriodListener(interval)
			
			let calls = 0
			
			let t0 = Date.now()
			
			listener.on(() => {
				calls++
				
				const now = Date.now()
				const t1 = now - t0
				t0 = now
				
				expect(t1).to.be.closeTo(interval, interval * tolerance)
				
				if (calls === target) {
					listener.stop()
					
					setTimeout(() => {
						expect(calls).to.equal(target)
						resolve()
					}, interval * 1.5)
				}
			})
		})
	}).timeout(3000)
	
	it("should not be able to be stopped twice", () => {
		const listener = createMockPeriodListener(100)
		
		listener.stop()
		
		expect(() => listener.stop()).to.throw()
	})
})

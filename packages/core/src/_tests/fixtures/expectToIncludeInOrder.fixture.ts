import { expect } from "chai"

export function expectToIncludeInOrder(val: any, targets: string[]) {
	let lastIdx = -1
	
	expect(val).to.be.a("string")
	
	let str = val as string
	
	for (const target of targets) { 
		const idx = str.indexOf(target)
		
		expect(idx).to.not.equal(-1, "Expected to find " + target + " in " + str)
		expect(idx).to.be.greaterThan(lastIdx, "Expected " + target + " to not be out of order")
		
		lastIdx = idx
	}
}

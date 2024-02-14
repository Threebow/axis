import { coerceBigInt, decimalToBigInt, isBigInt, isDecimal } from "../helpers"
import { expect } from "chai"

describe("BigInt helper", () => {
	it("should check if a value is a BigInt", () => {
		expect(isBigInt(0)).to.be.false
		expect(isBigInt("0")).to.be.false
		expect(isBigInt(0n)).to.be.true
		expect(isBigInt("0n")).to.be.false
	})
	
	it("should check if a value is a Decimal", () => {
		expect(isDecimal(null)).to.be.false
		expect(isDecimal({})).to.be.false
		expect(isDecimal({ s: 0, e: 0, d: null })).to.be.true
		expect(isDecimal({ s: 0, e: 0, d: [] })).to.be.true
		expect(isDecimal({ s: 0, e: 0, d: [0] })).to.be.true
		expect(isDecimal({ s: 0, e: 0, d: [0, 0] })).to.be.true
		expect(isDecimal({ s: 0, e: 0, d: [0, 0, 0] })).to.be.true
	})
	
	it("should convert a Decimal to a BigInt", () => {
		expect(decimalToBigInt({ s: 0, e: 0, d: null, toString: () => "12345" })).to.equal(12345n)
	})
	
	it("should coerce a value to a BigInt", () => {
		expect(coerceBigInt("12345678")).to.equal(12345678n)
		expect(coerceBigInt(12345n)).to.equal(12345n)
		expect(coerceBigInt({ s: 0, e: 0, d: null, toString: () => "67890" })).to.equal(67890n)
	})
})

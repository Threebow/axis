import { coerceBigInt, decimalToBigInt, isBigInt, isDecimal } from "../helpers"
import { expect } from "chai"

describe("BigInt helpers", () => {
	describe("isBigInt", () => {
		it("should return true if the value is a BigInt", () => {
			expect(isBigInt(0n)).to.be.true
			expect(isBigInt(1n)).to.be.true
			expect(isBigInt(1234567890n)).to.be.true
			expect(isBigInt(-1234567890n)).to.be.true
		})
		
		it("should return false if the value is not a BigInt", () => {
			expect(isBigInt(0)).to.be.false
			expect(isBigInt(1)).to.be.false
			expect(isBigInt(1234567890)).to.be.false
			expect(isBigInt(-1234567890)).to.be.false
			expect(isBigInt("0")).to.be.false
			expect(isBigInt("0n")).to.be.false
			expect(isBigInt("1")).to.be.false
			expect(isBigInt("1n")).to.be.false
			expect(isBigInt("1234567890")).to.be.false
			expect(isBigInt("1234567890n")).to.be.false
			expect(isBigInt("-1234567890")).to.be.false
			expect(isBigInt("-1234567890n")).to.be.false
			expect(isBigInt(null)).to.be.false
			expect(isBigInt(undefined)).to.be.false
			expect(isBigInt(true)).to.be.false
			expect(isBigInt(false)).to.be.false
			expect(isBigInt({})).to.be.false
			expect(isBigInt([])).to.be.false
		})
	})
	
	describe("isDecimal", () => {
		it("should check if a value is a Decimal", () => {
			expect(isDecimal(null)).to.be.false
			expect(isDecimal({})).to.be.false
			expect(isDecimal({ s: 0, e: 0, d: null })).to.be.true
			expect(isDecimal({ s: 0, e: 0, d: [] })).to.be.true
			expect(isDecimal({ s: 0, e: 0, d: [0] })).to.be.true
			expect(isDecimal({ s: 0, e: 0, d: [0, 0] })).to.be.true
			expect(isDecimal({ s: 0, e: 0, d: [0, 0, 0] })).to.be.true
		})
	})
	
	describe("decimalToBigInt", () => {
		it("should convert a Decimal to a BigInt", () => {
			expect(decimalToBigInt({ s: 0, e: 0, d: null, toString: () => "12345" })).to.equal(12345n)
			expect(decimalToBigInt({ s: 0, e: 0, d: null, toString: () => "12345e12" })).to.equal(123450000000n)
		})
	})
	
	describe("coerceBigInt", () => {
		it("should coerce a value to a BigInt", () => {
			expect(coerceBigInt("12345678")).to.equal(12345678n)
			expect(coerceBigInt(12345n)).to.equal(12345n)
			expect(coerceBigInt({ s: 0, e: 0, d: null, toString: () => "67890" })).to.equal(67890n)
		})
	})
})

import { isNumber } from "lodash-es"

export function isBigInt(x: any): x is bigint {
	try {
		return BigInt(x) === x
	} catch {
		return false
	}
}

export type Decimal = {
	readonly s: number,
	readonly e: number,
	readonly d: number[] | null
}

export function isDecimal(x: any): x is Decimal {
	return x != null &&
		isNumber(x.s)
		&& isNumber(x.e)
		&& ((Array.isArray(x.d) && x.d.every(isNumber)) || x.d === null)
}

export function decimalToBigInt(val: Decimal): bigint {
	// Convert Prisma.Decimal to a string
	let decimalString = val.toString()
	
	// Check if the string is in scientific notation
	if (/e/i.test(decimalString)) {
		// Split the string into base and exponent parts
		const [base, exponentStr] = decimalString.split("e")
		const exponent = parseInt(exponentStr, 10)
		
		// Check if base contains a decimal point
		const decimalIndex = base.indexOf(".")
		const coefficient = decimalIndex !== -1 ? base.replace(".", "") : base
		
		// Calculate the number of zeros to add
		const zerosToAdd = exponent - (coefficient.length - (decimalIndex !== -1 ? decimalIndex : 0))
		
		decimalString = coefficient + "0".repeat(zerosToAdd)
	}
	
	// Convert the string to a bigint
	return BigInt(decimalString)
}

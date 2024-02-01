import { isDate } from "lodash-es"
import { decimalToBigInt, isBigInt, isDecimal } from "./bigint.helper"

// TODO: make this ONLY accept subtypes of DTO, for type-safety

export function toJson<T>(value: T, pretty = false): string {
	return JSON.stringify(value, function (k, v) {
		const raw = this[k]
		
		if (isDecimal(raw)) {
			v = decimalToBigInt(v)
		}
		
		if (isBigInt(v)) {
			return { ___isBigInt: true, value: v.toString() }
		}
		
		if (isDate(raw)) {
			return { ___isDate: true, value: raw.toISOString() }
		}
		
		if (raw?.toJson) {
			return raw.toJson()
		}
		
		return v
	}, pretty ? 4 : 0)
}

export function fromJson<T>(json: string): T {
	return JSON.parse(json, (_, v) => {
		if (v?.___isBigInt) {
			return BigInt(v.value)
		}
		
		if (v?.___isDate) {
			return new Date(v.value)
		}
		
		return v
	})
}

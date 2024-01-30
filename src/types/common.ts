import { Decimal } from "@"

export type DateString = Date | string
export type DecimalBigInt = Decimal | bigint

/**
 * A key-value object, with optional typing, restricted to only one level of depth.
 */
export type KVObject<T = any> = {
	[k: string]: T
}

// TODO: type this correctly
export type ViewComponent = any

// Restrict our DTO values to a certain set of types
export type DTOMember
	= string
	| number
	| boolean
	| bigint
	| Date
	| {
	toJson: () => DTOMember
}
	| DTO
	| null
	| undefined
	| Decimal
	| DTOMember[]

export interface DTO {
	readonly [k: string]: DTOMember
}

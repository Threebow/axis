import type { AppLocalsDTO, BaseUserDTO } from "../dto"
import type { Decimal } from "../helpers"

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
	| { toJson: () => DTOMember }
	| DTO
	| null
	| undefined
	| Decimal
	| DTOMember[]

export interface DTO {
	readonly [k: string]: DTOMember
}

export type PageMeta = {
	title: string
	description: string
	author: string
	image?: string
}

export type PageData = {
	__DEV__: boolean
	__PROD__: boolean
	__TITLE__: string
	__META__: PageMeta
	__ASSET__: (filename: string) => string
	__HTML__: string
	__ENCODED_VIEW__: string
}

export type ViewData<LocalsDTO extends KVObject = {}> = {
	file: string
	layoutFiles: string[]
	props: DTO
	locals: LocalsDTO
	appLocals: AppLocalsDTO<BaseUserDTO>
	route?: string
}

/**
 * A record with implicit undefined values.
 */
export type ImplicitRecord<K extends string | number | symbol, T> = Record<K, T | undefined>

import "reflect-metadata"
import { BaseUserDTO, ErrorDTO } from "@/dto"

export * from "./classes"
export * from "./decorators"
export * from "./dto"
export * from "./helpers"
export * from "./stdlib"
export * from "./types"

export type Test = {
	one: string
	two: number
	three: ErrorDTO
}

export type AnotherTest = BaseUserDTO

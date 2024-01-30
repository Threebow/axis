import { IContext } from "@/classes/Context"
import { ZodRawShape } from "zod"

type ValidationTargetAccessor = (ctx: IContext) => unknown
type ValidationRules = string[] | ZodRawShape

export type ValidationMetadata = {
	readonly id: string
	readonly accessor: ValidationTargetAccessor
	readonly rules: ValidationRules
}

export function Validate(id: string, accessor: ValidationTargetAccessor, rules: ValidationRules) {
	return (target: any, key?: string | symbol) => {
		// TODO: abstract this junk out, be more DRY
		let stack: ValidationMetadata[]
		
		if (key) {
			stack = Reflect.getMetadata("validate", target, key)
		} else {
			stack = Reflect.getOwnMetadata("validate", target)
		}
		
		stack ??= []
		
		stack.push({ id, accessor, rules })
		
		const fn = Reflect.metadata("validate", stack)
		
		return key ? fn(target, key) : fn(target)
	}
}

export function Query(rules: ValidationRules) {
	return Validate("query", ctx => ctx.koaCtx.query, rules)
}

export function Params(rules: ValidationRules) {
	return Validate("params", ctx => ctx.koaCtx.params, rules)
}

export function Body(rules: ValidationRules) {
	return Validate("body", ctx => ctx.koaCtx.request.body, rules)
}

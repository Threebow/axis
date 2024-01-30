import { MiddlewareConstructor } from "@/classes/Middleware"

export function Use(ctor: MiddlewareConstructor) {
	return (target: any, key?: string | symbol) => {
		let stack: MiddlewareConstructor[]
		
		if (key) {
			stack = Reflect.getMetadata("middleware", target, key)
		} else {
			stack = Reflect.getOwnMetadata("middleware", target)
		}
		
		stack ??= []
		
		stack.push(ctor)
		
		const fn = Reflect.metadata("middleware", stack)
		
		return key ? fn(target, key) : fn(target)
	}
}

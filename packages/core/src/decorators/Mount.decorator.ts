import { ControllerConstructor } from "../classes"
import { ensureStringIsURISegment } from "../helpers/string.helper"
import camelcase from "camelcase"
import assert from "node:assert"

export type MountedController = {
	name: string
	uri: string,
	ctor: ControllerConstructor
}

export function Mount(uri: string, ctor: ControllerConstructor, name?: string) {
	// ensure uri
	uri = ensureStringIsURISegment(uri)
	
	// calculate default name
	if (!name) {
		name = camelcase(uri.slice(1), { preserveConsecutiveUppercase: true })
	}
	
	return (target: any, key?: string | symbol) => {
		let stack: MountedController[]
		
		if (key) {
			stack = Reflect.getMetadata("mount", target, key)
		} else {
			stack = Reflect.getOwnMetadata("mount", target)
		}
		
		stack ??= []
		
		assert.ok(name, `Invalid controller name for mount: ${name}`)
		
		stack.push({ name, uri, ctor })
		
		const fn = Reflect.metadata("mount", stack)
		
		return key ? fn(target, key) : fn(target)
	}
}

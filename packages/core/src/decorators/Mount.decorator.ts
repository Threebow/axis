import { ControllerConstructor } from "../classes"

export type MountedController = { uri: string, ctor: ControllerConstructor }

export function Mount(uri: string, ctor: ControllerConstructor) {
	return (target: any, key?: string | symbol) => {
		let stack: MountedController[]
		
		if (key) {
			stack = Reflect.getMetadata("mount", target, key)
		} else {
			stack = Reflect.getOwnMetadata("mount", target)
		}
		
		stack ??= []
		
		stack.push({ uri, ctor })
		
		const fn = Reflect.metadata("mount", stack)
		
		return key ? fn(target, key) : fn(target)
	}
}

import { chalk } from "../chalk"
import { handleError } from "./error.helper"

export function createLogger(
	name: string,
	color: string,
	onLog?: (args?: any[]) => Promise<void> | void
): (...args: any[]) => void {
	const colorFn = chalk.hex(color)
	
	return (...args: any[]) => {
		let prefix = `[${name}]:`
		
		if (__SERVER__) {
			prefix = `[${process.pid}] ` + prefix
		}
		
		console.log(colorFn(prefix), ...args)
		
		if (onLog) {
			process.nextTick(() => Promise
				.resolve(onLog(args))
				.catch(e => handleError(e, "custom log handler: " + name))
			)
		}
	}
}

import { chalk } from "../chalk"
import { handleError } from "./error.helper"

export function createLogger(
	name: string,
	color: string,
	onLog?: (args?: any[]) => Promise<void> | void
): (...args: any[]) => void {
	const colorFn = chalk.hex(color)
	
	return (...args: any[]) => {
		console.log(colorFn(`[${process.pid}] [${name}]:`), ...args)
		
		if (onLog) {
			process.nextTick(() => Promise
				.resolve(onLog(args))
				.catch(e => handleError(e, "custom log handler: " + name))
			)
		}
	}
}

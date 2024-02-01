import * as process from "process"
import { handleError } from "../helpers"

export type ListenerFunction<T> = (args: T) => Promise<any> | any

export interface IListener<T> {
	on(listener: ListenerFunction<T>): this
}

export abstract class Listener<T> implements IListener<T> {
	private listeners: ListenerFunction<T>[] = []
	
	protected trigger(input: T): void {
		process.nextTick(() => this.triggerAsync(input))
	}
	
	protected async triggerAsync(input: T): Promise<void> {
		try {
			await Promise.all(
				this.listeners
					.map(listener => listener(input))
					.map(r => Promise.resolve(r))
			)
		} catch (e: any) {
			handleError(e, `listener: ${this.constructor.name}`, true)
		}
	}
	
	on(listener: ListenerFunction<T>) {
		this.listeners.push(listener)
		return this
	}
}

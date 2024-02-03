import type { nextTick as NextTickType } from "process"
import { handleError } from "../helpers"

// dynamically import nextTick based on what build we are in
const nextTick: typeof NextTickType = __SERVER__
	? (await import("process")).nextTick
	: (callback: Function, ...args: any[]) => setTimeout(callback, 0, ...args)

export type ListenerFunction<T> = (args: T) => Promise<any> | any

export interface IListener<T> {
	on(listener: ListenerFunction<T>): this
}

export abstract class Listener<T> implements IListener<T> {
	private listeners: ListenerFunction<T>[] = []
	
	protected trigger(input: T): void {
		nextTick(() => this.triggerAsync(input))
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

import type { nextTick as NextTickType } from "process"
import { handleError } from "../helpers"

// dynamically import nextTick based on what build we are in
const nextTick: typeof NextTickType = __SERVER__
	? (await import("process")).nextTick
	: (callback: Function, ...args: any[]) => setTimeout(callback, 0, ...args)

export type ListenerGuardPredicate = () => Promise<boolean> | boolean
export type ListenerFunction<T> = (args: T) => Promise<any> | any
export type ListenerErrorHandler = (e: any) => void

export interface IListener<T> {
	/**
	 * Add a guard to the listener. The guard is called every time the listener is triggered. If the guard predicate
	 * returns false, the listener will not be called. At the moment, only one guard is allowed per listener.
	 */
	guard(handler: ListenerGuardPredicate): this
	
	/**
	 * Schedules a function to be run whenever this listener is invoked.
	 */
	on(listener: ListenerFunction<T>): this
	
	/**
	 * Schedules a function to be run whenever an error occurs in the listener.
	 *
	 * As important business logic is often scheduled to run within PeriodListeners, if one throws an error, it is
	 * good practice to consider the application to be in an unsafe state. As such, the default behavior of
	 * PeriodListener on an error is to submit an event to Sentry and kill the node process.
	 */
	onError(handler: ListenerErrorHandler): this
}

export abstract class Listener<T> implements IListener<T> {
	private guardPredicate?: ListenerGuardPredicate
	private listeners: ListenerFunction<T>[] = []
	private errorHandlers: ((e: any) => void)[] = []
	
	constructor(private readonly name: string) {
		// ...
	}
	
	protected trigger(input: T): void {
		nextTick(() => this.triggerAsync(input))
	}
	
	protected async triggerAsync(input: T): Promise<void> {
		try {
			// enforce guard predicate
			if (this.guardPredicate) {
				const allowed = await this.guardPredicate()
				
				if (!allowed) {
					return
				}
			}
			
			// call all listeners
			await Promise.all(
				this.listeners
					.map(listener => listener(input))
					.map(r => Promise.resolve(r))
			)
		} catch (e: any) {
			if (this.errorHandlers.length) {
				this.errorHandlers.forEach(handler => handler(e))
				return
			} else {
				handleError(e, `listener: ${this.name}`, true)
			}
		}
	}
	
	guard(handler: ListenerGuardPredicate) {
		if (this.guardPredicate) {
			throw new Error(`Guard for PeriodListener "${this.name}" has already been set.`)
		}
		
		this.guardPredicate = handler
		return this
	}
	
	on(listener: ListenerFunction<T>) {
		this.listeners.push(listener)
		return this
	}
	
	onError(handler: ListenerErrorHandler) {
		this.errorHandlers.push(handler)
		return this
	}
}

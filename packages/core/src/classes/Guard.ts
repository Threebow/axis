import { IApp } from "./App"
import { IContext } from "./Context"

export type GuardResult = boolean | number

export interface IGuard {
	/**
	 * Check if the current context is allowed to access the guarded route. The only way to allow access is to
	 * explicitly return true. If a number is returned from the guard, it is treated as a status code for the response.
	 */
	isAllowed(ctx: IContext): Promise<GuardResult> | GuardResult
}

export type GuardConstructor = new (app: IApp) => IGuard;

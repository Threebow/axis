export enum AppErrorType {
	NOT_FOUND = "NOT_FOUND",
	INVALID_INPUT = "INVALID_INPUT",
	RENDER_FAILED = "RENDER_FAILED",
	INVALID_ROUTE = "INVALID_ROUTE"
}

export interface IAppError extends Error {
	readonly type: AppErrorType;
	readonly message: string;
	readonly cause?: any
}

export class AppError extends Error implements IAppError {
	constructor(readonly type: AppErrorType, readonly message: string, readonly cause?: any) {
		super(type + ": " + message)
		
		this.name = this.constructor.name
		
		Object.setPrototypeOf(this, new.target.prototype)
	}
}

export function isAppError(e: any): e is AppError {
	return e instanceof AppError
}

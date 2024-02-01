export enum AppErrorType {
	NOT_FOUND,
	INVALID_INPUT
}

export interface IAppError extends Error {
	readonly type: AppErrorType;
	readonly message: string;
}

export class AppError extends Error implements IAppError {
	constructor(readonly type: AppErrorType, readonly message: string) {
		super(type + ": " + message)
		
		this.name = this.constructor.name
		
		Object.setPrototypeOf(this, new.target.prototype)
	}
}

export function isAppError(e: any): e is AppError {
	return e instanceof AppError
}

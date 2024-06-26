import { IExecutable } from "./Executable"
import { IApp } from "./App"
import { IContext } from "./Context"

export enum FlashMessageType {
	SUCCESS,
	ERROR
}

export type FlashMessage = Readonly<{
	type: FlashMessageType
	message: string
}>

export interface IFlasher extends IExecutable {
	withFlash(type: FlashMessageType, message: string): this
	
	withSuccess(message: string): this
	
	withError(message: string): this
}

export class Flasher implements IFlasher {
	private readonly messages: FlashMessage[] = []
	
	withFlash(type: FlashMessageType, message: string): this {
		this.messages.push({ type, message })
		return this
	}
	
	withSuccess(message: string): this {
		return this.withFlash(FlashMessageType.SUCCESS, message)
	}
	
	withError(message: string): this {
		return this.withFlash(FlashMessageType.ERROR, message)
	}
	
	execute(app: IApp, ctx: IContext): Promise<void> {
		if (app.useSessions) {
			ctx.session.flashMessages = this.messages
		}
		
		return Promise.resolve()
	}
}

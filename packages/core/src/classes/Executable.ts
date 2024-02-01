import { isFunction } from "lodash-es"
import { IApp } from "./App"
import { IContext } from "./Context"

export interface IExecutable {
	// TODO: make this DRY
	execute(app: IApp, ctx: IContext): Promise<void>
}

export function isExecutable(x: any): x is IExecutable {
	return isFunction(x?.execute)
}

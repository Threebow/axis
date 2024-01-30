import { isFunction } from "lodash-es"
import { IContext } from "@/classes/Context"
import { IApp } from "@/classes/App"

export interface IExecutable {
	// TODO: make this DRY
	execute(app: IApp, ctx: IContext): Promise<void>
}

export function isExecutable(x: any): x is IExecutable {
	return isFunction(x?.execute)
}

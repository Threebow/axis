import { KVObject } from "../../types"
import { IApp, IContext } from "../../classes"
import { createMockKoaContext } from "./createMockKoaContext.fixture"

export type MockContextOptions = Partial<{
	sessionData: KVObject
	headers: KVObject
	dontInitialize: boolean
}>

export async function createMockContext<Context extends IContext>(
	app: IApp<any, any, any, Context>,
	opts: MockContextOptions = {}
): Promise<Context> {
	const ctx = app.createContext(createMockKoaContext({ headers: opts.headers ?? {} }, {}, app.koa))
	
	if (opts.sessionData) {
		for (const i in opts.sessionData) {
			ctx.session[i] = opts.sessionData[i]
		}
	}
	
	if (!opts.dontInitialize) {
		await ctx.initialize()
	}
	
	return ctx
}

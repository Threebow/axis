import { RootController } from "./modules/Root.controller"
import { CustomContext } from "./context"
import { App, AppMode, IApp, IContext } from "../../classes"
import { IUser, MOCK_USERS } from "./classes/User.class"
import { CustomLocalsDTO, CustomUserDTO } from "./modules/Root.dto"
import { sleep } from "../../helpers"
import { mockKoaContext } from "../mocks/koa"
import { KVObject } from "../../types"

export function createMockRequireContext(): __WebpackModuleApi.RequireContext {
	function resolve(id: string): string {
		throw new Error("not implemented")
	}
	
	function keys(): string[] {
		return []
	}
	
	resolve.resolve = resolve
	resolve.keys = keys
	resolve.id = "MockRequireContext"
	
	return resolve
}

export function createMockApp(addFixtures = true, port = 3000): IApp<any, any, any, any> {
	const app = new App<CustomUserDTO, IUser, CustomLocalsDTO, CustomContext>({
		mode: AppMode.DEVELOPMENT,
		port,
		sessionKey: "blowfish",
		rootController: RootController,
		errorPage: null,
		
		// TODO: use a service or something?
		async resolveUser(id: string): Promise<IUser> {
			// simulate database access
			await sleep(100)
			
			const user = MOCK_USERS.find(u => u.id === id)
			return user ?? Promise.reject(new Error("User not found."))
		},
		
		context: CustomContext,
		moduleRoot: "./src/modules",
		assetManifest: {},
		renderer: {
			indexPage: "./dist/backend/index.pug",
			layouts: createMockRequireContext(),
			defaultPageMeta: {
				title: "AxisJS",
				description: "A framework for building web applications",
				author: "Threebow"
			}
		},
		modules: createMockRequireContext()
	})
	
	if (addFixtures) {
		before(() => app.boot())
		after(() => app.shutdown())
	}
	
	return app
}

export type MockContextOptions = Partial<{
	sessionData: KVObject
	headers: KVObject
	addFixtures: boolean
	dontInitialize: boolean
}>

export async function createMockContext<Context extends IContext>(
	app: IApp<any, any, any, Context>,
	opts: MockContextOptions = {}
): Promise<Context> {
	const ctx = app.createContext(mockKoaContext({ headers: opts.headers ?? {} }, {}, app.koa))
	
	if (opts.sessionData) {
		for (const i in opts.sessionData) {
			ctx.session[i] = opts.sessionData[i]
		}
	}

	if(!opts.dontInitialize) {
		await ctx.initialize()
	}
	
	return ctx
}

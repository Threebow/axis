import { KVObject } from "../../types"
import { App, AppMode, BodyParserOptions, ErrorHandler, IApp } from "../../classes"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { CustomLocalsDTO, CustomUserDTO } from "../app/modules/Root.dto"
import { IUser, MOCK_USERS } from "../app/classes/User.class"
import { CustomContext } from "../app/context"
import { RootController } from "../app/modules/Root.controller"
import ErrorPage from "../app/modules/Error.vue"
import { sleep } from "../../helpers"

const __dirname = dirname(fileURLToPath(import.meta.url))

export type MockAppOptions = {
	addFixtures: boolean
	port: number
	healthCheckData?: KVObject
	useRenderer: boolean
	useSession: boolean
	loggingEnabled: boolean
	bodyParserOptions: BodyParserOptions
	errorHandlers: ErrorHandler[]
}

export function createMockApp(opts?: Partial<MockAppOptions>): IApp<any, any, any, any> {
	opts = {
		addFixtures: true,
		port: 3000,
		useRenderer: false,
		useSession: false,
		loggingEnabled: false,
		errorHandlers: [],
		...opts
	}
	
	const app = new App<CustomUserDTO, IUser, CustomLocalsDTO, CustomContext>({
		mode: __DEV__ ? AppMode.DEVELOPMENT : AppMode.PRODUCTION,
		port: opts.port,
		sessionKey: opts.useSession ? "blowfish" : undefined,
		rootController: RootController,
		dist: __DIST__,
		context: CustomContext,
		moduleRoot: resolve(__dirname, "../app/modules"),
		
		// TODO: use a service or something?
		async resolveUser(id: string): Promise<IUser | false> {
			// simulate database access
			await sleep(100)
			return MOCK_USERS.find(u => u.id === id) ?? false
		},
		
		renderer: opts.useRenderer
			? {
				indexPage: "./src/frontend/index.pug",
				errorPage: ErrorPage,
				layouts: require.context("../app/modules", true, __LAYOUT_REGEX__),
				defaultPageMeta: {
					title: "AxisJS",
					description: "A framework for building web applications",
					author: "Threebow",
					image: "https://arionstudios.com/logo.png"
				}
			}
			: undefined,
		
		healthCheckData: opts.healthCheckData
			? () => opts!.healthCheckData!
			: undefined,
		
		loggingEnabled: opts.loggingEnabled,
		
		bodyParserOptions: opts.bodyParserOptions,
		
		errorHandlers: opts.errorHandlers
	})
	
	if (opts.addFixtures) {
		before(() => app.boot())
		after(() => app.shutdown())
	}
	
	return app
}

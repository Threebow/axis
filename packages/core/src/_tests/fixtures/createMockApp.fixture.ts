import { KVObject } from "../../types"
import { App, AppMode, IApp } from "../../classes"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { CustomLocalsDTO, CustomUserDTO } from "../app/modules/Root.dto"
import { IUser, MOCK_USERS } from "../app/classes/User.class"
import { CustomContext } from "../app/context"
import { RootController } from "../app/modules/Root.controller"
import ErrorPage from "../app/modules/Error.vue"
import { sleep } from "../../helpers"

const __dirname = dirname(fileURLToPath(import.meta.url))

export function createMockApp(
	addFixtures = true,
	port = 3000,
	healthCheckData?: KVObject
): IApp<any, any, any, any> {
	const app = new App<CustomUserDTO, IUser, CustomLocalsDTO, CustomContext>({
		mode: __DEV__ ? AppMode.DEVELOPMENT : AppMode.PRODUCTION,
		port,
		sessionKey: "blowfish",
		rootController: RootController,
		errorPage: ErrorPage,
		
		// TODO: use a service or something?
		async resolveUser(id: string): Promise<IUser | false> {
			// simulate database access
			await sleep(100)
			return MOCK_USERS.find(u => u.id === id) ?? false
		},
		
		dist: __DIST__,
		
		context: CustomContext,
		moduleRoot: resolve(__dirname, "../app/modules"),
		renderer: {
			indexPage: "./src/frontend/index.pug",
			layouts: require.context("../app/modules", true, __LAYOUT_REGEX__),
			defaultPageMeta: {
				title: "AxisJS",
				description: "A framework for building web applications",
				author: "Threebow",
				image: "https://arionstudios.com/logo.png"
			}
		},
		healthCheckData: healthCheckData
			? () => healthCheckData
			: undefined
	})
	
	if (addFixtures) {
		before(() => app.boot())
		after(() => app.shutdown())
	}
	
	return app
}

import { RootController } from "./modules/Root.controller"
import { CustomContext } from "./context"
import { App, AppMode, IApp } from "../../classes"
import { User } from "./classes/User.class"
import { CustomLocalsDTO, CustomUserDTO } from "./modules/Root.dto"

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

export function createMockApp(): IApp<any, any, any, any> {
	return new App<CustomUserDTO, User, CustomLocalsDTO, CustomContext>({
		mode: AppMode.DEVELOPMENT,
		port: 3000,
		sessionKey: "blowfish",
		rootController: RootController,
		errorPage: null,
		resolveUser() {
			throw new Error("not implemented")
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
}

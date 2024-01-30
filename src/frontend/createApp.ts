import { createSSRApp } from "vue"
import { KVObject, ViewComponent } from "@/types/common"
import { createLogger } from "../helpers"

const log = createLogger("createApp", "#42b883")

export function createApp(
	appComponent: ViewComponent,
	viewComponent: ViewComponent,
	rootProps: KVObject,
	layouts: any[] // FIXME: type this correctly
) {
	const app = createSSRApp(appComponent as any, rootProps)
		.component("AppView", viewComponent)
	
	layouts
		.forEach((c, i) => {
			// TODO: this should be fixed by typing layouts correctly
			if (!c.__FILENAME__) {
				throw new Error("Could not resolve filename from component")
			}
			
			log("Registering layout component:", "Layout" + i, c.__FILENAME__)
			app.component("Layout" + i, c)
		})
	
	log("App created.")
	
	return app
}

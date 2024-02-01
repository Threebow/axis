import { createSSRApp } from "vue"
import { createLogger } from "./helpers"
import { ViewComponent, ViewData } from "./types"
import { createVueApp } from "./frontend/app"

const log = createLogger("createApp", "#42b883")

export function createApp(
	viewComponent: ViewComponent,
	viewData: ViewData,
	layouts: { __FILENAME__: string }[]
) {
	// build and initialize the SSR app
	const app = createSSRApp({ setup: () => createVueApp() }, viewData)
	
	// register the main view component
	app.component("AppView", viewComponent)
	
	layouts
		.forEach((c, i) => {
			log("Registering layout component:", "Layout" + i, c.__FILENAME__)
			app.component("Layout" + i, c)
		})
	
	log("App created.")
	
	return app
}

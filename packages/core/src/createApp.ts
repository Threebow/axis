import { ConcreteComponent, createSSRApp, h, resolveComponent } from "vue"
import type { KVObject, ViewComponent, ViewData } from "./types"
import { isString } from "lodash-es"
import { Constants } from "./constants"
import { createPinia } from "pinia"

function resolveComponentOrThrow(name: string): ConcreteComponent {
	const comp = resolveComponent(name)
	
	if (isString(comp)) {
		throw new Error(name + " component not found.")
	}
	
	return comp
}

function mergeLocalsIntoProps(propDefs: KVObject, locals: KVObject): KVObject {
	if (!propDefs) {
		return {}
	}
	
	const propsToAdd: KVObject = {}
	
	for (const i in locals) {
		if (propDefs[i]) {
			propsToAdd[i] = locals[i]
		}
	}
	
	return propsToAdd
}

function createVueApp(view: ViewData) {
	const viewComponent = resolveComponentOrThrow("AppView")
	
	let vnode = h(
		viewComponent,
		mergeLocalsIntoProps(viewComponent.props, view.props)
	)
	
	view.layoutFiles
		.forEach((f, i, a) => {
			const layoutComponent = resolveComponentOrThrow("Layout" + (a.length - i - 1))
			const node = vnode
			vnode = h(layoutComponent, () => node)
		})
	
	return () => h("main", vnode)
}

export function createApp(
	viewComponent: ViewComponent,
	viewData: ViewData,
	layouts: { __FILENAME__: string }[]
) {
	// build and initialize the SSR app
	const app = createSSRApp({ setup: () => createVueApp(viewData) }, viewData)
	
	// set up pinia
	app.use(createPinia())
	
	// inject locals into the app so the locals composables can pick them up
	app.provide(Constants.LOCALS, viewData.locals)
	app.provide(Constants.APP_LOCALS, viewData.appLocals)
	
	// inject route name into the app so the route composables can pick it up
	app.provide(Constants.ROUTE, viewData.route)
	
	// register the main view component
	app.component("AppView", viewComponent)
	
	// register each layout component
	layouts.forEach((c, i) => app.component("Layout" + i, c))
	
	return app
}

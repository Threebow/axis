import { createLogger } from "../logger.helper"
import { ViewComponent, ViewData } from "../../types"
import { fromJson } from "../json.helper"
import { createApp } from "../../createApp"

const FADE_DURATION = 0.1 * 1000

const log = createLogger("initClient", "#56ffe8")

function removePreloader() {
	//Ensure preloader element exists
	const preloader = document.getElementById("preloader")
	if (!preloader) {
		return
	}
	
	document.documentElement.classList.remove("is-clipped")
	
	const end = Date.now() + FADE_DURATION
	
	function fadeOut() {
		if (!preloader?.parentElement) {
			return
		}
		
		const frac = (end - Date.now()) / FADE_DURATION
		
		if (frac > 0) {
			preloader.style.opacity = frac.toString()
			requestAnimationFrame(fadeOut)
		} else {
			preloader.parentElement.removeChild(preloader)
		}
	}
	
	requestAnimationFrame(fadeOut)
}

/**
 * Normalizes a layout or view path.
 * @param file
 */
function normalize(file: string): string {
	return file.startsWith("./") ? file : "./" + file
}

/**
 * This should be called at the start of the main client entry point build.
 * This is what parses the view data out of the window object and mounts the Vue app.
 */
export async function initClient(ctx: __WebpackModuleApi.RequireContext) {
	// Parse the view data from the window object
	const rawView: string = (window as any).__ENCODED_VIEW__
	const viewData = rawView ? fromJson<ViewData>(decodeURIComponent(rawView)) : null
	
	// Sanity check to ensure we have a view to load
	if (!viewData?.file) {
		throw new Error("No view provided to load.")
	}
	
	const viewFilePath = normalize(viewData.file)
	
	log("Loading view at:", viewFilePath)
	
	const viewComponent = await ctx(normalize(viewData.file)) as ViewComponent
	
	if (!viewComponent || !viewComponent.default) {
		log("Could not find component:", viewFilePath, viewComponent)
		throw new Error(`View at path "${viewFilePath}" not found. Available views: ${ctx.keys().join(", ")}`)
	}
	
	log("Loaded view:", viewComponent.default.__FILENAME__)
	
	// load layouts
	const layouts = await Promise.all(
		viewData
			.layoutFiles
			.map(async (file) => {
				const layout = await ctx(file)
				
				if (!layout) {
					throw new Error("LAYOUT NOT FOUND: " + file)
				}
				
				return layout.default
			})
	)
	
	createApp(
		viewComponent.default,
		viewData,
		layouts
	)
		.mount("#app")
	
	removePreloader()
	
	log("Client initialized.")
}

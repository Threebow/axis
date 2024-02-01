import { createLogger } from "../logger.helper"
import { ViewData } from "../../types"
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
 * This should be called at the start of the main client entry point build.
 * This is what parses the view data out of the window object and mounts the Vue app.
 */
export async function initClient() {
	// Parse the view data from the window object
	const rawView: string = (window as any).__ENCODED_VIEW__
	const viewData = rawView ? fromJson<ViewData>(decodeURIComponent(rawView)) : null
	
	// Sanity check to ensure we have a view to load
	if (!viewData?.file) {
		throw new Error("No view provided to load.")
	}
	
	log("Loading view data:", viewData)
	
	const viewComponent = await import("./" + viewData.file + ".vue")
	if (!viewComponent) {
		console.error(viewComponent)
		throw new Error("View not found: " + viewData.file)
	}
	
	log("Loaded view component:", viewComponent.default)
	
	// load layouts
	const layouts = await Promise.all(
		viewData
			.layoutFiles
			.map(async (file) => {
				if (file === ".") {
					file = ""
				} else {
					file += "/"
				}
				
				const layout = await import("./" + file + "layout.vue")
				
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

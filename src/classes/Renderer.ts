import { join, normalize, parse, relative } from "path"
import { fromJson, toJson } from "@/helpers/json.helper"
import { renderToString } from "vue/server-renderer"
import { DTO, ViewComponent } from "@/types/common"
import { IContext } from "@/classes/Context"
import { IResponder, Responder } from "@/classes/Responder"
import { AppMode, IApp } from "@/classes/App"
import { compileFile, compileTemplate } from "pug"
import { createApp } from "@/frontend/createApp"
import AppComponent from "@/frontend/App.vue"

const PAGE_CACHE = new Map<string, compileTemplate>()

type ResolvedLayout = {
	readonly file: string
	readonly dir: string
	readonly component: any
}

export interface IRenderer<Data extends DTO> extends IResponder {
	render(component: ViewComponent, data: Data): this
}

export class Renderer<Data extends DTO> extends Responder implements IRenderer<Data> {
	private view?: { component: ViewComponent, data: Data }
	
	render(component: ViewComponent, data: Data): this {
		this.view = { component, data }
		return this
	}
	
	private cleanPath(path: string) {
		return path.replace(/\\/g, "/")
	}
	
	private resolveLayout(layoutCtx: __WebpackModuleApi.RequireContext, dir: string): ResolvedLayout[] {
		const layouts = layoutCtx.keys()
		
		if (!layouts.length) {
			return []
		}
		
		const res: ResolvedLayout[] = []
		
		let attempts = 0
		
		while (true) {
			attempts++
			
			if (attempts >= 10) {
				throw new Error("Too many layouts")
			}
			
			const parsed = parse(dir)
			
			const testPath = join(dir, "./layout.vue")
			
			const layoutPath = layouts
				.find(path => normalize(path) === testPath)
			
			if (layoutPath) {
				res.push({
					file: layoutPath,
					dir: join(parsed.dir, parsed.base),
					component: layoutCtx(layoutPath).default
				})
			}
			
			if (parsed.base === ".." || parsed.base === "." || parsed.base === "") {
				break
			}
			
			dir = join(dir, "../")
		}
		
		return res
			.reverse()
	}
	
	override async execute(app: IApp, ctx: IContext): Promise<void> {
		// ensure we have been provided a view before proceeding
		if (!this.view) {
			throw new Error("Cannot execute renderer with no view set.")
		}
		
		// deconstruct the view provided
		const { component, data } = this.view
		
		// validate we have a component and that it has a file name
		if (!component?.__FILENAME__) {
			console.error("Got bad component:", component)
			throw new Error("Component file name could not be found.")
		}
		
		// calculate the relative path to the component
		const delta = relative(app.opts.moduleRoot, component.__FILENAME__)
		const { dir, name } = parse(delta)
		const file = join(dir, name)
		
		// resolve any layouts that may be present
		const layouts = this.resolveLayout(app.opts.renderer.layouts, dir)
		
		// build data to be rendered on the view
		const view = toJson({
			file: this.cleanPath(file),
			layoutFiles: layouts.map(l => this.cleanPath(l.dir)),
			props: data,
			locals: {
				...ctx.locals,
				user: ctx.user?.toJson() ?? null,
				__APP_VERSION__: app.version
			}
		})
		
		// initialize the vue app with the component, layouts, and view data
		const vue = createApp(
			AppComponent,
			component,
			fromJson(view),
			layouts.map(l => l.component)
		)
		
		// render the app to html
		const appHtml = await renderToString(vue)
			.catch(e => {
				// simply log out some additional data and rethrow the error, so we have some context
				// TODO: better solution? handle in included error handler that detects vue render errors?
				console.error("SSR Failed:", fromJson(view))
				return Promise.reject(e)
			})
		
		// fetch the compiled page from cache if it exists
		let indexPage = PAGE_CACHE.get(app.opts.renderer.indexPage)
		
		// if it doesn't exist, compile it and cache it
		if (!indexPage) {
			indexPage = compileFile(app.opts.renderer.indexPage)
			PAGE_CACHE.set(app.opts.renderer.indexPage, indexPage)
		}
		
		// render the index page
		const html = indexPage({
			__DEV__: app.opts.mode === AppMode.DEVELOPMENT,
			__PROD__: app.opts.mode === AppMode.PRODUCTION,
			
			// TODO: Move into stdlib somehow?
			asset(filename: string) {
				const resolved = app.opts.assetManifest[filename]
				return resolved ? join("/", resolved) : filename
			},
			
			html: appHtml,
			
			view: encodeURIComponent(view)
		})
		
		// now that we have our final html, we can tell the internal responder to respond with it
		this.send(html)
		
		// and finally, execute parent responders
		await super.execute(app, ctx)
	}
}

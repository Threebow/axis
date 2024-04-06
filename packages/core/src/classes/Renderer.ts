import { join, parse, relative, resolve } from "path"
import { renderToString } from "vue/server-renderer"
import { compileFile, compileTemplate } from "pug"
import { DTO, PageData, PageMeta, ViewComponent, ViewData } from "../types"
import { IApp } from "./App"
import { fromJson, toJson } from "../helpers"
import { IResponder, Responder } from "./Responder"
import { IContext } from "./Context"
import { createApp } from "../createApp"
import { AppMode } from "./AppOptions"
import { AppError, AppErrorType } from "./AppError"

const PAGE_CACHE = new Map<string, compileTemplate>()

type ResolvedLayout = {
	readonly file: string
	readonly dir: string
	readonly component: any
}

export interface IRenderer<Data extends DTO> extends IResponder {
	render(component: ViewComponent, data: Data): this
	
	overrideMeta(meta: Partial<PageMeta>): this
}

export class Renderer<Data extends DTO> extends Responder implements IRenderer<Data> {
	private view?: { component: ViewComponent, data: Data }
	private meta?: Partial<PageMeta>
	
	render(component: ViewComponent, data: Data): this {
		this.view = { component, data }
		return this
	}
	
	overrideMeta(meta: Partial<PageMeta>): this {
		this.meta = meta
		return this
	}
	
	private cleanPath(path: string): string {
		return path.replace(/\\+/g, "/")
	}
	
	/**
	 * Walks down the provided files and resolves any layouts that should be rendered under the view.
	 */
	private resolveLayouts(layoutCtx: __WebpackModuleApi.RequireContext, dir: string): ResolvedLayout[] {
		const layouts = layoutCtx.keys()
		
		if (!layouts.length) {
			return []
		}
		
		const res: ResolvedLayout[] = []
		
		let attempts = 0
		
		while (true) {
			attempts++
			
			// This is only here to safeguard against accidental infinite loops.
			// Ideally we would support infinite layouts, but first we need to solve the halting problem.
			if (attempts >= 50) {
				throw new Error("Too many layouts")
			}
			
			const parsed = parse(dir)
			
			// There can be at most one layout per directory, we need to find the appropriate layout in this directory
			// We do this by finding the layout that is in the same directory that the view file is in
			const layoutPath = layouts
				.find(path => !this.cleanPath(relative(this.cleanPath(dir), this.cleanPath(path))).includes("/"))
			
			if (layoutPath) {
				res.push({
					file: layoutPath,
					dir: join(parsed.dir, parsed.base),
					component: layoutCtx(layoutPath).default
				})
			}
			
			// If we reach the root directory, stop
			if (parsed.base === ".." || parsed.base === "." || parsed.base === "") {
				break
			}
			
			// Walk further down the directory tree
			dir = join(dir, "../")
		}
		
		return res
			.reverse()
	}
	
	override async execute(app: IApp, ctx: IContext): Promise<void> {
		// ensure the app has a renderer
		if (!app.opts.renderer) {
			throw new Error("Cannot execute renderer with no app renderer options defined.")
		}
		
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
		
		// calculate the absolute path to the component
		const absolute = resolve(process.cwd(), component.__FILENAME__)
		
		// calculate the relative path to the component from the module root
		const delta = relative(app.opts.moduleRoot, absolute)
		const { dir, base } = parse(delta)
		const file = join(dir, base)
		
		// resolve any layouts that should be rendered under this view
		const layouts = this.resolveLayouts(app.opts.renderer.layouts, dir)
		
		// build data to be rendered on the view
		const view = toJson<ViewData>({
			file: this.cleanPath(file),
			layoutFiles: layouts.map(l => l.file),
			props: data,
			locals: ctx.locals,
			appLocals: {
				user: ctx.user?.toJson(),
				__APP_VERSION__: app.version
			}
		})
		
		// initialize the vue app with the component, layouts, and view data
		const vue = createApp(
			component,
			fromJson(view),
			layouts.map(l => l.component)
		)
		
		// render the app to html
		const appHtml = await renderToString(vue)
			.catch(e => {
				return Promise.reject(
					new AppError(AppErrorType.RENDER_FAILED, "SSR render failed: " + e.message, e)
				)
			})
		
		// fetch the compiled page from cache if it exists
		let indexPage = PAGE_CACHE.get(app.opts.renderer.indexPage)
		
		// if it doesn't exist, compile it and cache it
		if (!indexPage) {
			indexPage = compileFile(app.opts.renderer.indexPage)
			PAGE_CACHE.set(app.opts.renderer.indexPage, indexPage)
		}
		
		const metadata: PageMeta = {
			...app.opts.renderer.defaultPageMeta,
			...(this.meta ?? {})
		}
		
		// render the index page
		const html = indexPage({
			__DEV__: app.opts.mode === AppMode.DEVELOPMENT,
			__PROD__: app.opts.mode === AppMode.PRODUCTION,
			
			__TITLE__: metadata.title,
			__META__: metadata,
			
			// TODO: move into its own function
			__ASSET__(filename: string) {
				return join("/", app.assetManifest[filename] ?? filename)
			},
			
			__HTML__: appHtml,
			
			__ENCODED_VIEW__: encodeURIComponent(view)
		} as PageData)
		
		// now that we have our final html, we can tell the internal responder to respond with it
		this.send(html)
		
		// and finally, execute parent responders
		await super.execute(app, ctx)
	}
}

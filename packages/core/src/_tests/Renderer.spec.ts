import { createMockAppWithContext } from "./fixtures/createMockAppWithContext.fixture"
import { expect } from "chai"
import { fromJson, getVersionString, render, uuid } from "../helpers"
import Root from "./app/modules/Root.vue"
import { RootIndexDTO } from "./app/modules/Root.dto"
import NestedTest from "./app/modules/NestedLayouts/A/B/C/NestedTest.vue"
import { ViewData } from "../types"

describe("Renderer", () => {
	const mock = createMockAppWithContext()
	
	it("should render an HTML page from a Vue component with props", async () => {
		const data: RootIndexDTO = { uuid: uuid() }
		
		await mock.ctx.respond(render<RootIndexDTO>(Root, data))
		
		expect(mock.ctx.koaCtx.status).to.equal(200)
		expect(mock.ctx.koaCtx.body).to.startWith("<!DOCTYPE html>").and.endWith("</html>")
		expect(mock.ctx.koaCtx.body).to.include("UUID: " + data.uuid)
	})
	
	it("should render a preloader", async () => {
		await mock.ctx.respond(render(Root))
		expect(mock.ctx.koaCtx.body).to.include(`<div id="preloader"><div class="spinner is-64x64"></div></div>`)
	})
	
	it("should encode view data into the page", async () => {
		const str = `window.__ENCODED_VIEW__ = "`
		
		await mock.ctx.respond(render(NestedTest))
		const r = mock.ctx.koaCtx.body as string
		
		expect(r).to.include(str)
		
		const encoded = r.split(str)[1].split("\"")[0]
		const data = fromJson(decodeURIComponent(encoded))
		
		expect(data).to.deep.equal({
			file: "NestedLayouts/A/B/C/NestedTest",
			layoutFiles: [
				".",
				"NestedLayouts",
				"NestedLayouts/A/B",
				"NestedLayouts/A/B/C"
			],
			locals: {
				__APP_VERSION__: getVersionString()
			},
			props: {}
		} as ViewData)
	})
	
	describe("Layouts", () => {
		it("should be rendered correctly", async () => {
			await mock.ctx.respond(render(NestedTest))
			const r = mock.ctx.koaCtx.body
			
			expect(r).to.include("Hello from Root.layout.vue!")
			expect(r).to.include("Hello from NestedLayouts.layout.vue!")
			expect(r).to.include("Hello from unnamed layout.vue in B!")
			expect(r).to.include("Hello from C.layout.vue!")
			expect(r).to.include("Hello from NestedTest.vue!")
		})
	})
	
	describe("Metadata", () => {
		it("should be injected into the appropriate meta tags", async () => {
			const meta = mock.app.opts.renderer.defaultPageMeta
			
			await mock.ctx.respond(render(Root))
			const r = mock.ctx.koaCtx.body
			
			expect(r).to.include(`<meta name="author" content="${meta.author}">`)
			expect(r).to.include(`<meta name="description" content="${meta.description}">`)
			
			expect(r).to.include(`<meta property="og:title" content="${meta.title}">`)
			expect(r).to.include(`<meta property="og:description" content="${meta.description}">`)
			
			expect(r).to.include(`<meta property="og:image" content="${meta.image}">`)
			expect(r).to.include(`<meta name="twitter:card" content="summary_large_image">`)
		})
	})
})

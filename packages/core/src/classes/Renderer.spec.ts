import { assert, expect } from "chai"
import { getVersionString, uuid } from "../helpers"
import { ViewData } from "../types"
import { render } from "../helpers/backend"
import { RootIndexDTO } from "../_tests/app/modules/Root.dto"
import { createMockAppWithContext, expectToIncludeInOrder, extractAndParseEncodedViewData } from "../_tests/fixtures"
import NestedTest from "../_tests/app/modules/NestedLayouts/A/B/C/NestedTest.vue"
import Root from "../_tests/app/modules/Root.vue"
import { MOCK_LINKS } from "../_tests/app/modules/middleware/Custom.middleware"

describe("Renderer", () => {
	const mock = createMockAppWithContext({
		useRenderer: true
	})
	
	it("should render an HTML page from a Vue component with props", async () => {
		const data: RootIndexDTO = { uuid: uuid() }
		
		await mock.ctx.respond(render<RootIndexDTO>(Root, data))
		
		expect(mock.ctx.koaCtx.status).to.equal(200)
		expect(mock.ctx.koaCtx.body).to.startWith("<!DOCTYPE html>").and.endWith("</html>")
		expect(mock.ctx.koaCtx.body).to.include("UUID: " + data.uuid)
	})
	
	it("should inject user and app locals", async () => {
		const props: RootIndexDTO = { uuid: uuid() }
		
		mock.ctx.locals.links = MOCK_LINKS
		
		await mock.ctx.respond(render<RootIndexDTO>(Root, props))
		
		const data = extractAndParseEncodedViewData(mock.ctx.koaCtx.body as string)
		
		expect(data.locals).to.deep.equal({
			links: MOCK_LINKS
		})
		
		expect(data.appLocals).to.deep.equal({
			__APP_VERSION__: getVersionString()
		})
	})
	
	it("should render a preloader", async () => {
		await mock.ctx.respond(render(Root))
		expect(mock.ctx.koaCtx.body).to.include(`<div id="preloader"><div class="spinner is-64x64"></div></div>`)
	})
	
	it("should encode view data into the page", async () => {
		await mock.ctx.respond(render(NestedTest))
		const r = mock.ctx.koaCtx.body as string
		
		const data = extractAndParseEncodedViewData(r)
		
		expect(data).to.deep.equal({
			file: "NestedLayouts/A/B/C/NestedTest.vue",
			layoutFiles: [
				"./Root.layout.vue",
				"./NestedLayouts/NestedLayouts.layout.vue",
				"./NestedLayouts/A/B/layout.vue",
				"./NestedLayouts/A/B/C/C.layout.vue"
			],
			locals: {},
			appLocals: {
				__APP_VERSION__: getVersionString()
			},
			props: {}
		} as ViewData)
	})
	
	// TODO: test that layouts have access to props
	
	describe("Layouts", () => {
		it("should be rendered correctly", async () => {
			mock.ctx.locals.links = MOCK_LINKS
			
			await mock.ctx.respond(render(NestedTest))
			
			expectToIncludeInOrder(mock.ctx.koaCtx.body, [
				"Hello from Root.layout.vue!",
				"Version: " + getVersionString(),
				"Logged in as: ~",
				`Links: ${MOCK_LINKS.map(l => l.name).join(",")}`,
				"Hello from NestedLayouts.layout.vue!",
				"Hello from unnamed layout.vue in B!",
				"Hello from C.layout.vue!",
				"Hello from NestedTest.vue!"
			])
		})
	})
	
	describe("Metadata", () => {
		it("should be injected into the appropriate meta tags", async () => {
			assert(mock.app.opts.renderer != null)
			const meta = mock.app.opts.renderer.defaultPageMeta
			
			await mock.ctx.respond(render(Root))
			
			expectToIncludeInOrder(mock.ctx.koaCtx.body, [
				`<meta name="author" content="${meta.author}">`,
				`<meta name="description" content="${meta.description}">`,
				
				`<meta property="og:title" content="${meta.title}">`,
				`<meta property="og:description" content="${meta.description}">`,
				
				`<meta property="og:image" content="${meta.image}">`,
				`<meta name="twitter:card" content="summary_large_image">`
			])
		})
	})
})

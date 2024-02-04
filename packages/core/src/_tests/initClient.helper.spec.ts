import { createMockAppWithContext } from "./fixtures/createMockAppWithContext.fixture"
import { extractEncodedViewData } from "./fixtures/extractEncodedViewData"
import NestedTest from "./app/modules/NestedLayouts/A/B/C/NestedTest.vue"
import { render } from "../helpers/backend"
import { afterEach } from "node:test"
import { initClient } from "../helpers/frontend"
import { assert, expect } from "chai"
import { stub } from "sinon"

describe("Init client helper", () => {
	const mock = createMockAppWithContext()
	
	it("should read and load the view and layouts correctly", async () => {
		stub(console, "log")
		stub(console, "error")
		
		await mock.ctx.respond(render(NestedTest));
		
		// we need to set the encoded view data on the window object
		(global.window as any) ??= {};
		(global.window as any).__ENCODED_VIEW__ = extractEncodedViewData(mock.ctx.koaCtx.body as string)
		
		// make sure this throws for a good reason, and not because the modules couldn't be found
		await assert.isRejected(
			initClient(require.context("./app/modules", true, __FRONTEND_INIT_REGEX__)),
			"document is not defined"
		)
		
		// ensure views got loaded
		expect(console.log).to.have.callCount(2)
		expect(console.error).to.not.have.been.called
		
		// TODO: figure out how to get these to work
		// expect(console.log).to.have.been.calledWith("Loaded view: ./NestedLayouts/A/B/C/nestedTest.vue"`)
		// expect(console.log).to.have.been.calledWith("Loaded view: src/_tests/app/modules/NestedLayouts/A/B/C/NestedTest.vue")
	})
	
	afterEach(() => delete (window as any).__ENCODED_VIEW__)
})

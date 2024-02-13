import { CustomContext } from "../app/context"
import { createMockApp } from "./createMockApp.fixture"
import { createMockContext, MockContextOptions } from "./createMockContext.fixture"

export function createMockAppWithContext(opts?: MockContextOptions) {
	const app = createMockApp(opts?.addFixtures)
	
	let ctx: CustomContext
	beforeEach(async () => ctx = await createMockContext<CustomContext>(app, opts))
	
	return {
		app,
		get ctx() {
			return ctx
		}
	}
}

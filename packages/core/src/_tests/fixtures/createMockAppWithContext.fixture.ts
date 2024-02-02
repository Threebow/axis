import { createMockApp, createMockContext, MockContextOptions } from "../app"
import { CustomContext } from "../app/context"

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

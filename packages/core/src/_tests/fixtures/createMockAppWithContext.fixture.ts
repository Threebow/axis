import { CustomContext } from "../app/context"
import { createMockApp, MockAppOptions } from "./createMockApp.fixture"
import { createMockContext, MockContextOptions } from "./createMockContext.fixture"

export function createMockAppWithContext(appOpts?: Partial<MockAppOptions>, ctxOpts?: MockContextOptions) {
	const app = createMockApp(appOpts)
	
	let ctx: CustomContext
	beforeEach(async () => ctx = await createMockContext<CustomContext>(app, ctxOpts))
	
	return {
		app,
		get ctx() {
			return ctx
		}
	}
}

import { expect } from "chai";
import { MOCK_LINKS } from "../_tests/app/modules/middleware/Custom.middleware";
import { createMockAppWithContext } from "../_tests/fixtures";
import { render } from "../helpers/backend";
import Locals from "../_tests/app/frontend/components/Locals.vue";
import { MOCK_USERS } from "../_tests/app/classes/User.class";
import { sample } from "lodash-es";
import { getVersionString, toJson } from "../helpers";
import { CustomLocalsDTO } from "../_tests/app/modules/Root.dto";

describe("useLocals() composable", () => {
	const user = sample(MOCK_USERS)!
	
	const mock = createMockAppWithContext(
		{ useSession: true, useRenderer: true },
		{ sessionData: { userId: user.id } }
	)
	
	it("should expose the correct user and app-level locals", async () => {
		mock.ctx.locals.links = MOCK_LINKS
		
		await mock.ctx.respond(render(Locals))
		
		expect(mock.ctx.koaCtx.status).to.equal(200)
		
		const expected = toJson<CustomLocalsDTO>({
			links: MOCK_LINKS,
			user: user.toJson(),
			__APP_VERSION__: getVersionString()
		})
		
		expect(mock.ctx.koaCtx.body).to.include("<p>" + expected + "</p>")
	})
})

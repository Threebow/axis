import { expect } from "chai"
import { MOCK_LINKS } from "../_tests/app/middleware/Custom.middleware"
import { createMockAppWithContext } from "../_tests/fixtures"
import { render } from "../helpers/backend"
import Locals from "../_tests/app/frontend/components/Locals.vue"
import { MOCK_USERS } from "../_tests/app/classes/User.class"
import { sample } from "lodash-es"
import { fromJson, getVersionString } from "../helpers"
import { CustomLocalsDTO, CustomUserDTO } from "../_tests/app/modules/Root.dto"
import { AppLocalsDTO } from "../dto"

describe("useLocals() and useAppLocals()", () => {
	const user = sample(MOCK_USERS)!
	
	const mock = createMockAppWithContext(
		{ useSession: true, useRenderer: true },
		{ sessionData: { userId: user.id } }
	)
	
	it("should expose the correct locals", async () => {
		mock.ctx.locals.links = MOCK_LINKS
		
		await mock.ctx.respond(render(Locals))
		
		expect(mock.ctx.koaCtx.status).to.equal(200)
		
		const expected: {
			locals: CustomLocalsDTO,
			appLocals: AppLocalsDTO<CustomUserDTO>
		} = {
			locals: {
				links: MOCK_LINKS
			},
			appLocals: {
				__APP_VERSION__: getVersionString(),
				user: user.toJson()
			}
		}
		
		expect(mock.ctx.koaCtx.body).to.be.a("string")
		
		const json = (mock.ctx.koaCtx.body as string)
			.split(`<p class="locals-wrapper">`)
			?.[1]
			?.split("</p>")
			?.[0]
		
		expect(json?.length).to.be.greaterThan(0)
		
		const parsed = fromJson(json!)
		
		expect(parsed).to.deep.equal(expected)
	})
})

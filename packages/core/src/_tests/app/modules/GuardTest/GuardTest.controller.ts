import { Controller } from "../../../../classes"
import { Get, Guard, Mount } from "../../../../decorators"
import { IsAuthenticatedGuard } from "../../../../guards"
import { NestedGuardTestController } from "./NestedGuardTest.controller"

@Guard(IsAuthenticatedGuard)
@Mount("nested", NestedGuardTestController)
export class GuardTestController extends Controller {
	@Get()
	guardTest() {
		return 204
	}
}

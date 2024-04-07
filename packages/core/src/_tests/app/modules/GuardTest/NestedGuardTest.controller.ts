import { Controller } from "../../../../classes"
import { Get, Mount } from "../../../../decorators"
import { DeeplyNestedGuardTestController } from "./DeeplyNestedGuardTest.controller"

@Mount("deep", DeeplyNestedGuardTestController)
export class NestedGuardTestController extends Controller {
	@Get("nested-test")
	nestedTest() {
		return 204
	}
}

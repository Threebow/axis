import { Controller } from "../../../../classes"
import { Get } from "../../../../decorators"

export class DeeplyNestedGuardTestController extends Controller {
	@Get("test")
	test() {
		return 204
	}
}

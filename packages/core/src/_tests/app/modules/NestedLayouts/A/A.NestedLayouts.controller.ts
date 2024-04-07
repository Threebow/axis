import { Delete, Mount } from "../../../../../decorators"
import { Controller } from "../../../../../classes"
import { BNestedLayoutsController } from "./B/B.NestedLayouts.controller"

@Mount("/b", BNestedLayoutsController, "customB")
export class ANestedLayoutsController extends Controller {
	// ...
	@Delete("cool-test")
	coolTest() {
		return "cool"
	}
}

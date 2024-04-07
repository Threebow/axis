import { CNestedLayoutsController } from "./C/C.NestedLayouts.controller"
import { Get, Mount } from "../../../../../../decorators"
import { Controller } from "../../../../../../classes"

@Mount("c", CNestedLayoutsController)
export class BNestedLayoutsController extends Controller {
	// ...
	
	@Get("some-method")
	someMethod() {
		return 404
	}
}

import { CNestedLayoutsController } from "./C/C.NestedLayouts.controller"
import { Get, Mount } from "../../../../../../decorators"
import { Controller } from "../../../../../../classes"
import { Name } from "../../../../../../decorators/Name.decorator"

@Name("customB")
@Mount("c", CNestedLayoutsController)
export class BNestedLayoutsController extends Controller {
	// ...
	
	@Get("some-method")
	someMethod() {
		return 404
	}
}

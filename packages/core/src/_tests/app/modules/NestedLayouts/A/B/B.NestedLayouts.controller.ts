import { CNestedLayoutsController } from "./C/C.NestedLayouts.controller"
import { Mount } from "../../../../../../decorators"
import { Controller } from "../../../../../../classes"

@Mount("/c", CNestedLayoutsController)
export class BNestedLayoutsController extends Controller {
	// ...
}

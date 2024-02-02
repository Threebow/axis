import { Controller } from "../../../../classes"
import { Mount } from "../../../../decorators"
import { ANestedLayoutsController } from "./A/A.NestedLayouts.controller"

@Mount("/a", ANestedLayoutsController)
export class NestedLayoutsController extends Controller {
	// ...
}

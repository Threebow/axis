import { Mount } from "../../../../../decorators"
import { Controller } from "../../../../../classes"
import { BNestedLayoutsController } from "./B/B.NestedLayouts.controller"

@Mount("/b", BNestedLayoutsController)
export class ANestedLayoutsController extends Controller {
	// ...
}

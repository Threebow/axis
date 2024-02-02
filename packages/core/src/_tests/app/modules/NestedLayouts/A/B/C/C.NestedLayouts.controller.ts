import { Controller } from "../../../../../../../classes"
import { render } from "../../../../../../../helpers"
import NestedTest from "./NestedTest.vue"
import { Get } from "../../../../../../../decorators"

export class CNestedLayoutsController extends Controller {
	@Get("/")
	show() {
		return render(NestedTest)
	}
}

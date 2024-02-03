import { Controller } from "../../../../../../../classes"
import NestedTest from "./NestedTest.vue"
import { Get } from "../../../../../../../decorators"
import { render } from "../../../../../../../helpers/backend"

export class CNestedLayoutsController extends Controller {
	@Get("/")
	show() {
		return render(NestedTest)
	}
}

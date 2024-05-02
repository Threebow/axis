import { Delete } from "../../../../decorators"
import { Controller } from "../../../../classes"

export abstract class DeepParentController extends Controller {
	@Delete()
	destroy() {
		return 204
	}
}

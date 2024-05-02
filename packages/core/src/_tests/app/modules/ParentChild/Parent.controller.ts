import { Get, Params, Patch } from "../../../../decorators"
import { z } from "zod"
import { CustomContext } from "../../context"
import { DeepParentController } from "./DeepParent.controller"

export abstract class ParentController extends DeepParentController {
	@Get()
	index() {
		return "ParentController#index"
	}
	
	@Patch(":id")
	@Params({
		id: z.string().uuid()
	})
	update(ctx: CustomContext) {
		return `ParentController#update:${ctx.params.id}:${this.childMethod(ctx)}`
	}
	
	protected abstract childMethod(ctx: CustomContext): number
}

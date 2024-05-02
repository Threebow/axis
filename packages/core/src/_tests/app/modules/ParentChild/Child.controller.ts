import { ParentController } from "./Parent.controller"
import { Post } from "../../../../decorators"
import { CustomContext } from "../../context"
import { z } from "zod"

export class ChildController extends ParentController {
	@Post()
	create() {
		return 201
	}
	
	protected childMethod(ctx: CustomContext): number {
		return z
			.coerce
			.number()
			.parse(ctx.body.test)
	}
}

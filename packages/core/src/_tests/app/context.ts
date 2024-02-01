import { Context as KoaContext } from "koa"
import { CustomLocalsDTO, CustomUserDTO } from "./modules/Root.dto"
import { User } from "./classes/User.class"
import { Context, IApp } from "../../classes"

export class CustomContext extends Context<CustomUserDTO, User, CustomLocalsDTO> {
	constructor(
		readonly app: IApp<any, any, any, any>,
		readonly koaCtx: KoaContext
	) {
		super(app, koaCtx)
	}
}

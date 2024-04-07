import { GuardResult, IContext, IGuard } from "../classes"

/**
 * Guard to check if the user has been authenticated.
 */
export class IsAuthenticatedGuard implements IGuard {
	isAllowed(ctx: IContext): Promise<GuardResult> | GuardResult {
		return ctx.user ? true : 401
	}
}

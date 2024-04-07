import { GuardResult, IContext, IGuard } from "../classes"

/**
 * Guard to check if the user is a guest.
 */
export class IsGuestGuard implements IGuard {
	isAllowed(ctx: IContext): Promise<GuardResult> | GuardResult {
		return !ctx.user
	}
}

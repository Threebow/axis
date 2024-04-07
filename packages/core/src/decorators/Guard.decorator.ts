import { GuardConstructor } from "../classes"

/**
 * Decorator
 */
export function Guard(guard: GuardConstructor) {
	return Reflect.metadata("guard", guard)
}

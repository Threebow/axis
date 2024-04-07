import { inject } from "vue"
import { Constants } from "../constants"

export function useRoute(): string {
	const val = inject<string>(Constants.ROUTE)
	
	if (!val) {
		throw new Error("useRoute() failed to inject route")
	}
	
	return val
}

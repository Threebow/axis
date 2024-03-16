import { ref, Ref } from "vue"
import { RequestResult } from "../axios.helper"
import { handleError } from "../error.helper"
import { ErrorDTO } from "../../dto";
import { AxiosError } from "axios";

export type ActionsControls = {
	isDoingAction: Ref<boolean>
	doAction: (
		guard: Ref<boolean>,
		action: () => Promise<RequestResult> | -1,
		onError?: (error: AxiosError, dto: ErrorDTO) => void
	) => Promise<void>
}

export function useActions(): ActionsControls {
	const isDoingAction = ref(false)
	
	async function doAction(
		guard: Ref<boolean>,
		action: () => Promise<RequestResult> | -1,
		onError?: (error: AxiosError, dto: ErrorDTO) => void
	) {
		if (!guard.value) {
			return
		}
		
		if (isDoingAction.value) {
			return
		}
		
		isDoingAction.value = true
		
		let done = false
		
		try {
			const r = await action()
			
			// special case -1 means early exit without throwing an error
			if (r === -1) {
				isDoingAction.value = false
			} else if (!r.success) {
				// request was unsuccessful
				if (onError) {
					onError(r.error, r.data)
					isDoingAction.value = false
				} else {
					throw r.error
				}
			} else {
				// success
				done = true
			}
		} catch (e) {
			isDoingAction.value = false
			handleError(e, "do action")
		}
		
		if (done) {
			window.location.reload()
		}
	}
	
	return { isDoingAction, doAction }
}

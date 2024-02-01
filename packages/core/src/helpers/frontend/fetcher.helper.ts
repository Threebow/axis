import { Ref, ref } from "vue"
import { RequestResult, RequestResultData } from "../axios.helper"
import { sleep } from "../sleep.helper"
import { debounce, DebounceCallback } from "../debounce.helper"
import { ErrorDTO } from "../../dto"

const PASTE_DELAY = 25

export type FetcherControls<T> = {
	readonly query: Ref<string>
	readonly loading: Ref<boolean>
	readonly results: Ref<T | null>
	readonly error: Ref<ErrorDTO | null>
	readonly search: DebounceCallback
	readonly paste: () => Promise<void>
}

export function useFetcher<T extends RequestResultData>(
	fn: (q: string) => Promise<RequestResult<T>>,
	debounceDelay = 300
): FetcherControls<T> {
	const query = ref("")
	const loading = ref(false)
	const results: Ref<T | null> = ref(null)
	const error = ref<ErrorDTO | null>(null)
	
	async function doSearch(): Promise<void> {
		if (loading.value) {
			return
		}
		
		loading.value = true
		
		results.value = null
		error.value = null
		
		const r = await fn(query.value)
		
		if (r.success) {
			results.value = r.data
		} else {
			error.value = r.data
		}
		
		loading.value = false
	}
	
	const search = debounce(doSearch, debounceDelay)
	
	// it is necessary to delay paste
	async function paste() {
		await sleep(PASTE_DELAY)
		return doSearch()
	}
	
	return { query, loading, results, error, search, paste }
}

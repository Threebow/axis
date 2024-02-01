import { onBeforeUnmount, onMounted } from "vue"
import { sleep } from "../sleep.helper"

export function repeat(fn: () => Promise<void> | void, interval: number) {
	let stop = false
	
	onMounted(() => {
		(async () => {
			while (!stop) {
				await fn()
				await sleep(interval)
			}
		})()
	})
	
	onBeforeUnmount(() => {
		stop = true
	})
}

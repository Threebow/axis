export type DebounceCallback = (...args: any[]) => Promise<any>

export function debounce<T, Callback extends DebounceCallback>(
	callback: Callback,
	delay: number
): (...args: Parameters<Callback>) => Promise<T> {
	let timeout: NodeJS.Timeout | null = null
	
	return (...args: any[]) => {
		if (timeout) {
			clearTimeout(timeout)
		}
		
		return new Promise<T>((resolve) => {
			const p = new Promise<void>((resolve) => {
				timeout = setTimeout(resolve, delay)
			})
			
			p.then(async () => {
				resolve(await callback(...args))
			})
		})
	}
}

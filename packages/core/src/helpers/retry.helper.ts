import { sleep } from "./sleep.helper"

export type RetryOptions = {
	delay: number
	maxAttempts: number
}

type RetryErrorTest = (e: any) => boolean

export namespace RetryErrorTests {
	export const UndiciConnectTimeoutError: RetryErrorTest =
		(e: any) => e?.cause?.code === "UND_ERR_CONNECT_TIMEOUT"
}

export async function retry<T>(
	fn: () => Promise<T> | T,
	testError: RetryErrorTest,
	opts: RetryOptions = { delay: 50, maxAttempts: 100 }
): Promise<T> {
	let attempts = 0
	
	while (true) {
		attempts++
		
		if (attempts > opts.maxAttempts) {
			throw new Error(`Retry failed after ${opts.maxAttempts} attempts.`)
		}
		
		try {
			return await Promise.resolve(fn())
		} catch (e) {
			if (!testError(e)) {
				throw e
			}
		}
		
		await sleep(opts.delay)
	}
}

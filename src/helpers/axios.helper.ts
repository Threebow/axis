import axios, { AxiosError, AxiosRequestConfig, isAxiosError } from "axios"

export type RequestResultData = {
	readonly [k: string]: any
}

export type RequestResult<T extends RequestResultData = any, E extends RequestResultData = any> = {
	readonly success: true
	readonly data: T
} | {
	readonly success: false
	readonly error: AxiosError
	readonly data: E
}

export async function request<
	T extends RequestResultData = any,
	E extends RequestResultData = any
>(url: string, opts: AxiosRequestConfig): Promise<RequestResult<T, E>> {
	try {
		const r = await axios.request({
			url,
			...opts,
			headers: {
				...opts.headers,
				"Accept": "application/json",
				"Content-Type": "application/json"
			}
		})
		
		return {
			success: true,
			data: r.data as T
		}
	} catch (e: any) {
		if (isAxiosError(e) && e.response) {
			return {
				success: false,
				error: e,
				data: e.response.data as E
			}
		} else throw e
	}
}

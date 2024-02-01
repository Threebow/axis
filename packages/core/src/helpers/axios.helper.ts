import axios, { AxiosError, AxiosRequestConfig, isAxiosError } from "axios"
import { KVObject } from "../types"
import { ErrorDTO } from "../dto"

export type RequestResultData = {
	readonly [k: string]: any
}

export type RequestResult<
	T extends RequestResultData = any,
	E extends ErrorDTO = ErrorDTO
> = {
	readonly success: true
	readonly status: number
	readonly data: T
} | {
	readonly success: false
	readonly error: AxiosError
	readonly data: E
}

export async function request<
	T extends RequestResultData = any,
	E extends ErrorDTO = ErrorDTO
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
			status: r.status,
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

export function createRequester(baseOpts?: AxiosRequestConfig) {
	return <
		T extends RequestResultData = any,
		E extends ErrorDTO = ErrorDTO
	>(method: string, path: string, data?: KVObject, params?: KVObject, opts?: AxiosRequestConfig): Promise<RequestResult<T, E>> => {
		return request<T, E>(path, {
			...baseOpts,
			method,
			data,
			params: (method === "GET" && !params) ? data : params,
			...opts
		})
	}
}

import axios, { AxiosError, AxiosRequestConfig, isAxiosError } from "axios"
import { KVObject } from "../types"
import { ErrorDTO } from "../dto"
import { fromJson } from "./json.helper"

export type RequestResultData = {
	readonly [k: string]: any
}

// TODO: this entire file needs to be rethought

/**
 * Represents the result of an HTTP request.
 */
export type RequestResult<
	T extends RequestResultData = any,
	E extends ErrorDTO = ErrorDTO
> = {
	/**
	 * Whether the request's status code is in the 2xx range.
	 */
	readonly success: true
	
	/**
	 * The status code of the response.
	 */
	readonly status: number
	
	/**
	 * The data returned by the server.
	 */
	readonly data: T
} | {
	/**
	 * If the request returned non-2XX, this will be `false`.
	 */
	readonly success: false
	
	/**
	 * The raw error thrown by Axios.
	 */
	readonly error: AxiosError
	
	/**
	 * The standardized HTTP error DTO returned by the server. The status will be present in this object.
	 */
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
				"Accept": "application/json",
				"Content-Type": "application/json",
				...opts.headers
			},
			transformResponse(body, headers) {
				if (headers.has("x-axis-json", "1")) {
					return fromJson(body)
				}
				
				if (headers.has("content-type", "application/json")) {
					return JSON.parse(body)
				}
				
				return body
			}
		})
		
		return {
			success: true,
			status: r.status,
			data: r.data
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

export interface IRequester {
	/**
	 * Makes a request. If this is a GET request and no query parameters are provided, the `data` parameter will be
	 * used as for query parameters, as data is ignored for GET requests.
	 */<
		T extends RequestResultData = any,
		E extends ErrorDTO = ErrorDTO
	>(
		method: string,
		path: string,
		data?: KVObject,
		params?: KVObject,
		opts?: AxiosRequestConfig
	): Promise<RequestResult<T, E>>
}

export function createRequester(baseOpts?: AxiosRequestConfig): IRequester {
	function makeRequest<T extends RequestResultData = any, E extends ErrorDTO = ErrorDTO>(
		method: string,
		path: string,
		data?: KVObject,
		params?: KVObject,
		opts?: AxiosRequestConfig
	): Promise<RequestResult<T, E>> {
		return request<T, E>(path, {
			...baseOpts,
			method,
			data,
			params: (method === "GET" && !params) ? data : params,
			...opts
		})
	}
	
	return makeRequest
}

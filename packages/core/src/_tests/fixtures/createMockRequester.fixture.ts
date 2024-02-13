import { createRequester } from "../../helpers"

export function createMockRequester(): ReturnType<typeof createRequester> {
	return createRequester({ baseURL: "http://localhost:3000" })
}

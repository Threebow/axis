import { createRequester } from "../../helpers"

export function createMockRequester() {
	return createRequester({ baseURL: "http://localhost:3000" })
}

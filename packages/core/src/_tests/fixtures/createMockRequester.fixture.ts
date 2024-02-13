import { createRequester } from "../../helpers"

export function createMockRequester(port = 3000): ReturnType<typeof createRequester> {
	return createRequester({ baseURL: `http://localhost:${port}` })
}

export function ensureStorageAvailable(storage: any): asserts storage is Storage {
	const TEST = "Hello world!"
	
	try {
		storage.setItem(TEST, TEST)
		storage.removeItem(TEST)
	} catch {
		throw new Error("Provided storage instance is not available.")
	}
}

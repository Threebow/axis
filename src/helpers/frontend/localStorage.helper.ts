export function ensureLocalStorageAvailable() {
	const TEST = "Hello world!"
	
	try {
		localStorage.setItem(TEST, TEST)
		localStorage.removeItem(TEST)
	} catch {
		throw new Error("Local storage is not available.")
	}
}

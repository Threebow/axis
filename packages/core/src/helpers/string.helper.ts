export function ensureStringStartsWith(str: string, start: string): string {
	return str.startsWith(start) ? str : start + str
}

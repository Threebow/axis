const URI_DELIMITER = "/"

export function ensureStringStartsWith(str: string, start: string): string {
	return str.startsWith(start) ? str : start + str
}

export function ensureStringDoesNotEndWith(str: string, end: string): string {
	while(str.endsWith(end)) {
		str = str.substring(0, str.length - end.length)
	}
	
	return str
}

export function ensureStringIsURISegment(str: string): string {
	str = ensureStringDoesNotEndWith(str, URI_DELIMITER)
	str = ensureStringStartsWith(str, URI_DELIMITER)
	return str
}

export function upsert<T>(fn: () => Promise<T>): Promise<T> {
	// we only need to retry one time according to prisma docs:
	// https://www.prisma.io/docs/orm/reference/prisma-client-reference#solution
	
	return fn()
		.catch(e => e?.code === "P2002" ? fn() : Promise.reject(e))
}

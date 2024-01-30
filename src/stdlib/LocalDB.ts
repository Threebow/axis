import { ensureLocalStorageAvailable, fromJson } from "@"

export interface ILocalDB {
	get<T>(key: string): T | undefined
	
	set<T>(key: string, value: T): void
}

export class LocalDB implements ILocalDB {
	constructor(private readonly prefixStr: string) {
		ensureLocalStorageAvailable()
	}
	
	private prefix(key: string) {
		return this.prefixStr + ":" + key
	}
	
	get<T>(key: string): T | undefined {
		const item = localStorage.getItem(this.prefix(key))
		
		if (item == null) {
			return
		}
		
		return fromJson(item) as T
	}
	
	set<T>(key: string, value: T) {
		localStorage.setItem(this.prefix(key), JSON.stringify(value))
	}
}

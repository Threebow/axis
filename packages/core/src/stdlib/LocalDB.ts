import { fromJson, toJson } from "../helpers"
import { ensureStorageAvailable } from "../helpers/frontend"

export interface ILocalDB {
	get<T>(key: string): T | undefined
	
	set<T>(key: string, value: T): void
}

export class LocalDB implements ILocalDB {
	constructor(private readonly prefixStr: string, private readonly driver = localStorage) {
		ensureStorageAvailable(driver)
	}
	
	private prefix(key: string) {
		return this.prefixStr + ":" + key
	}
	
	get<T>(key: string): T | undefined {
		const item = this.driver.getItem(this.prefix(key))
		
		if (item == null) {
			return
		}
		
		return fromJson(item)
	}
	
	set<T>(key: string, value: T) {
		this.driver.setItem(this.prefix(key), toJson(value))
	}
}

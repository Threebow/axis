import { LocalDB } from "../stdlib"
import { expect } from "chai"

function createMockLocalStorage(): Storage {
	let storage: Record<string, string | undefined> = {}
	
	return {
		get length() {
			return Object.keys(storage).length
		},
		clear() {
			storage = {}
		},
		getItem(key: string): string | null {
			return storage[key] ?? null
		},
		key(index: number): string | null {
			return this.getItem(Object.keys(storage)[index])
		},
		removeItem(key: string): void {
			delete storage[key]
		},
		setItem(key: string, value: string): void {
			storage[key] = value
		}
	}
}

describe("LocalDB", () => {
	const db = new LocalDB("test", createMockLocalStorage())
	
	it("should allow values to be set and retrieved", () => {
		const key = "test123"
		const value = "hello world"
		
		db.set(key, value)
		
		expect(db.get(key)).to.equal(value)
	})
	
	it("should return undefined for non-existent keys", () => {
		expect(db.get("non-existent")).to.be.undefined
	})
})

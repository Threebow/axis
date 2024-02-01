import { assert, expect } from "chai"
import { isRef } from "vue"
import { restore } from "sinon"
import { createMockApp } from "./app"
import { createRequester, FetcherControls, useFetcher } from "../helpers"
import { TodoDTO } from "./app/modules/Todo/Todo.dto"
import { ErrorDTO } from "../dto"

describe("Fetcher helper", () => {
	const delay = 50
	
	const app = createMockApp()
	
	before(() => app.boot())
	
	let controls: FetcherControls<any>
	
	const r = createRequester({ baseURL: "http://localhost:3000" })
	
	const createMockTodo = async (title = "Test Todo"): Promise<TodoDTO> => {
		const item = await r<TodoDTO>("POST", "/todos", { title })
		assert(item.success)
		expect(item.data.id).to.be.a.uuid("v4")
		expect(item.data.title).to.equal(title)
		return item.data
	}
	
	beforeEach(() => {
		controls = useFetcher(q => r("GET", "/todos", { q }), delay)
	})
	
	it("should return controls", async () => {
		expect(controls).to.be.an("object")
		
		assert(
			isRef(controls.query) &&
			isRef(controls.loading) &&
			isRef(controls.results) &&
			isRef(controls.error),
			
			"controls did not return refs"
		)
		
		expect(controls.search).to.be.a("function")
		expect(controls.paste).to.be.a("function")
	})
	
	it("should fetch while maintaining correct loading state", async () => {
		const item = await createMockTodo()
		
		controls.query.value = item.title
		
		expect(controls.loading.value).to.be.false
		
		await controls.search()
		
		expect(controls.loading.value).to.be.false
		
		expect(controls.results.value.find((r: TodoDTO) => r.id === item.id)).to.deep.equal(item)
	})
	
	it("allows pasting into the input", async () => {
		const item = await createMockTodo()
		
		controls.query.value = item.title
		
		await controls.paste()
		
		expect(controls.results.value.find((r: TodoDTO) => r.id === item.id)).to.deep.equal(item)
	})
	
	it("should render an error if the request fails", async () => {
		controls = useFetcher(() => r("GET", "http://localhost:3000/error"), delay)
		
		await controls.search()
		
		expect(controls.results.value).to.be.null
		expect(controls.error.value).to.deep.equal({
			status: 404,
			extra: "Not Found"
		})
	})
	
	it("should not allow searching twice at a time", async () => {
		// set to ensure it doesn't get overwritten
		const test: ErrorDTO = {
			status: 500
		}
		
		controls.error.value = test
		
		controls.loading.value = true
		
		await controls.search()
		
		expect(controls.loading.value).to.be.true
		expect(controls.error.value).to.deep.equal(test)
	})
	
	afterEach(() => restore())
	
	after(() => app.shutdown())
})

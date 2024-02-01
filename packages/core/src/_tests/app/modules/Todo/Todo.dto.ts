import { uuid } from "../../../../helpers"

export type TodoDTO = {
	id: string
	title: string
	completed: boolean
}

// normally we wouldn't have anything like this in a dto file, but it's fine to leave it here for our tests
export const MOCK_TODOS: TodoDTO[] = [
	{
		id: uuid(),
		title: "Buy eggs",
		completed: false
	},
	{
		id: uuid(),
		title: "Buy milk",
		completed: true
	},
	{
		id: uuid(),
		title: "Buy bread",
		completed: false
	}
]

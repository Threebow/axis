import { uuid } from "../../../../helpers"
import { DateTime } from "luxon"

export type TodoDTO = {
	id: string
	title: string
	completed: boolean
	createdAt: Date
}

// normally we wouldn't have anything like this in a dto file, but it's fine to leave it here for our tests
export const MOCK_TODOS: TodoDTO[] = [
	{
		id: uuid(),
		title: "Buy eggs",
		completed: false,
		createdAt: DateTime
			.now()
			.minus({ minutes: 60 })
			.toJSDate()
	},
	{
		id: uuid(),
		title: "Buy milk",
		completed: true,
		createdAt: DateTime
			.now()
			.minus({ minutes: 30 })
			.toJSDate()
	},
	{
		id: uuid(),
		title: "Buy bread",
		completed: false,
		createdAt: new Date()
	}
]

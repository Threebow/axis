import { CustomUserDTO } from "../modules/Root.dto"
import { BaseUser, IBaseUser } from "../../../classes"
import { uuid } from "../../../helpers"

export interface IUser extends IBaseUser<CustomUserDTO> {
	isPasswordCorrect(password: string): Promise<boolean>
}

export class User extends BaseUser<CustomUserDTO> implements IUser {
	isPasswordCorrect(password: string): Promise<boolean> {
		return Promise.resolve(password === "hunter2")
	}
}

// mock user database
export const MOCK_USERS: IUser[] = [
	new User({ id: uuid(), name: "User 1", email: "a@b.c", createdAt: new Date() }),
	new User({ id: uuid(), name: "User 2", email: "d@e.f", createdAt: new Date(Date.now() - 15000) }),
	new User({ id: uuid(), name: "User 3", email: "g@h.i", createdAt: new Date(Date.now() - 30000) })
]

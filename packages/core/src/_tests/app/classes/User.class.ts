import { CustomUserDTO } from "../modules/Root.dto"
import { BaseUser } from "../../../classes"

export class User extends BaseUser<CustomUserDTO> {
	isPasswordCorrect(password: string): Promise<boolean> {
		return Promise.resolve(password === "hunter2")
	}
}

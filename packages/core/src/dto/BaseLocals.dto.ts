import { BaseUserDTO } from "./User.dto"

export type AppLocalsDTO<UserDTO extends BaseUserDTO> = {
	__APP_VERSION__: string
	user?: UserDTO
}

import { BaseUserDTO } from "./User.dto"

export type BaseLocalsDTO<U extends BaseUserDTO> = {
	__APP_VERSION__: string
	user?: U
}

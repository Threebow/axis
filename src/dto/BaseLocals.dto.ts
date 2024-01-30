// base locals injected by the framework
import { BaseUserDTO } from "@/dto/User.dto"

export type BaseLocalsDTO<U extends BaseUserDTO> = {
	__APP_VERSION__: string
	user?: U
}

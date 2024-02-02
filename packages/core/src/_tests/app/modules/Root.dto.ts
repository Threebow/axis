import { BaseLocalsDTO, BaseUserDTO } from "../../../dto"

export type CustomUserDTO = BaseUserDTO & {
	name: string
	email: string
	createdAt: Date
}

export type ExampleLink = {
	name: string
	href: string
}

export type CustomLocalsDTO = BaseLocalsDTO<CustomUserDTO> & {
	links: ExampleLink[]
}

export type RootIndexDTO = {
	uuid: string
}

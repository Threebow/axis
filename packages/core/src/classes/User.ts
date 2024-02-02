import { BaseUserDTO } from "../dto"

export interface IBaseUser<DTO extends BaseUserDTO> {
	readonly id: string
	
	toJson(): DTO
}

export abstract class BaseUser<DTO extends BaseUserDTO> implements IBaseUser<DTO> {
	readonly id = this.data.id
	
	constructor(private readonly data: DTO) {
		// ...
	}
	
	toJson(): DTO {
		return this.data
	}
}

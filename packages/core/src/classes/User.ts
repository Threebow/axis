import { BaseUserDTO } from "../dto"

export interface IUser<DTO extends BaseUserDTO> {
	toJson(): DTO
}

export abstract class BaseUser<DTO extends BaseUserDTO> implements IUser<DTO> {
	protected constructor(private readonly data: DTO) {
		// ...
	}
	
	toJson(): DTO {
		return this.data
	}
}

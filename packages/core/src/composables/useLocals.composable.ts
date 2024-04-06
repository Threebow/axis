import { inject } from "vue"
import { Constants } from "../constants"
import { KVObject } from "../types"
import { AppLocalsDTO, BaseUserDTO } from "../dto"

export function useLocals<LocalsDTO extends KVObject>(): LocalsDTO {
	const val = inject<LocalsDTO>(Constants.LOCALS)
	
	if (!val) {
		throw new Error("useLocals() failed to inject locals")
	}
	
	return val
}

export function useAppLocals<
	UserDTO extends BaseUserDTO,
	LocalsDTO = AppLocalsDTO<UserDTO>
>(): LocalsDTO {
	const val = inject<LocalsDTO>(Constants.APP_LOCALS)
	
	if (!val) {
		throw new Error("useAppLocals() failed to inject app locals")
	}
	
	return val
}

import { inject } from "vue";
import { BaseLocalsDTO, BaseUserDTO } from "../dto";
import { Constants } from "../constants";

export function useLocals<T extends BaseLocalsDTO<BaseUserDTO>>(): T {
	const val = inject<T>(Constants.LOCALS)
	
	if (!val) {
		throw new Error("useLocals() failed to inject locals")
	}
	
	return val
}

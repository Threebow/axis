import { inject } from "vue";
import { Symbols } from "../symbols";
import { BaseLocalsDTO, BaseUserDTO } from "../dto";

export function useLocals<T extends BaseLocalsDTO<BaseUserDTO>>(): T {
	const val = inject<T>(Symbols.LOCALS)
	
	if (!val) {
		throw new Error("useLocals() must be called within a component")
	}
	
	return val
}

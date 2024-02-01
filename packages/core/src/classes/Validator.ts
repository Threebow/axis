import { z, ZodString } from "zod"
import { ValidationMetadata } from "../decorators"
import { IContext } from "./Context"

export interface IValidator {
	get(id: string): any
	
	validate(metadata: ValidationMetadata): Promise<any>
}

export class Validator implements IValidator {
	private cache: Record<string, any> = {}
	
	constructor(private readonly ctx: IContext) {
		// ...
	}
	
	get(id: string): any {
		return this.cache[id]
	}
	
	async validate({ id, accessor, rules }: ValidationMetadata): Promise<any> {
		if (this.cache[id]) {
			return Promise.resolve(this.cache[id])
		}
		
		// if provided a string array, simply test for presence of each string
		if (Array.isArray(rules)) {
			const obj: { [k: string]: ZodString } = {}
			rules.forEach(key => obj[key] = z.string())
			rules = obj
		}
		
		const raw = accessor(this.ctx)
		
		const data = await z
			.object(rules)
			.parseAsync(raw)
		
		this.cache[id] = data
		
		return data
	}
}

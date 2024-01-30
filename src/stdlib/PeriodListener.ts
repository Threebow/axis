import { Listener } from "./Listener"
import { sleep } from "../helpers"

export class PeriodListener extends Listener<void> {
	constructor(private readonly interval: number) {
		super()
		
		process.nextTick(() => this.process())
	}
	
	async process() {
		while (true) {
			await sleep(this.interval)
			await this.triggerAsync()
		}
	}
}

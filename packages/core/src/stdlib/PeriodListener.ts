import { Listener } from "./Listener"
import { sleep } from "../helpers"

export class PeriodListener extends Listener<void> {
	private stopped = false
	
	constructor(name: string, private readonly interval: number) {
		super(name)
		
		process.nextTick(() => this.process())
	}
	
	async process() {
		while (!this.stopped) {
			await sleep(this.interval)
			await this.triggerAsync()
		}
	}
	
	stop() {
		if (this.stopped) {
			throw new Error("Already stopped")
		}
		
		this.stopped = true
	}
}

const crypto = require("crypto"),
	  Sentry = require("@sentry/node");

class Task {
	constructor(action, interval = 1000) {
		//we can use the sync version of randomBytes because tasks should only be created on setup
		this.id = crypto.randomBytes(16).toString("hex");

		this.action = action;
		this.interval = interval;

		this.timeout = null;
		this.isRunning = false;

		this.timesRan = 0;
		this.totalRuntime = 0;
		this.lastRuntime = null;
		this.lastRanAt = null;
	}

	async run() {
		this.timeout = null;
		this.isRunning = true;

		let t1 = process.hrtime();

		try {
			await this.action();
		} catch(e) {
			if(process.env.NODE_ENV === "production") {
				Sentry.withScope(scope => {
					scope.setTag("source", "TASK_MANAGER");
					console.log(`TASK ERROR: ${Sentry.captureException(e)}`);
				});
			} else {
				console.log("TASK ERROR:");
				console.error(e);
				process.exit(1);
			}
		}

		let t2 = process.hrtime(t1);

		this.lastRanAt = new Date();

		this.timesRan++;
		this.lastRuntime = (t2[0] * 1000) + (t2[1] / 1e6);
		this.totalRuntime += this.lastRuntime;

		this.isRunning = false;

		this.queue();
	}

	queue() {
		if(this.timeout) clearTimeout(this.timeout);
		this.timeout = setTimeout(this.run.bind(this), this.interval);
	}

	getRemainingTime() {
		if(this.isRunning || !this.timeout) return null;
		return (this.timeout._idleStart + this.timeout._idleTimeout) - (process.uptime() * 1000);
	}
}

module.exports = class TaskManager {
	constructor() {
		this.tasks = new Map();
	}

	createTask(action, interval) {
		let task = new Task(action, interval);
		task.queue();
		this.tasks.set(task.id, task);
		return task;
	}
};
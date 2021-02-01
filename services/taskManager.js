const crypto = require("crypto"),
	  Sentry = require("@sentry/node");

class Task {
	constructor(action, interval = 1000, singleRun = false) {
		this.action = action;
		this.interval = interval;
		this.singleRun = singleRun;

		//Generate a unique ID for this task on initialization, if it is a repeating task.
		//We can use the sync version of randomBytes because repeating tasks should only be created on startup.
		if(!this.singleRun) {
			this.id = crypto.randomBytes(16).toString("hex");
		}

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
			await Promise.resolve(this.action());
		} catch(e) {
			if(process.env.NODE_ENV === "production") {
				Sentry.withScope(scope => {
					scope.setTag("source", "TASK_MANAGER");
					console.error(`TASK MANAGER ERROR: ${Sentry.captureException(e)}`);
				});
			} else {
				console.error("TASK MANAGER ERROR:");
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

		if(!this.singleRun) {
			this.queue();
		}
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

	createTask(action, interval, singleRun) {
		let task = new Task(action, interval, singleRun);

		if(task.id) {
			this.tasks.set(task.id, task);
		}

		task.queue();

		return task;
	}
};
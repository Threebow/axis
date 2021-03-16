const SessionMiddleware = require("../middleware/session"),
	  {Server}          = require("socket.io"),
	  Sentry            = require("@sentry/node");

module.exports = class SocketIOServer {
	constructor(app) {
		this._app = app;

		this.options = {};

		app.on("serverCreated", server => {
			this._initSocketServer(server);
		});
	}

	_findSessionMiddleware() {
		let arr = this._app._middleware.get("base")._middleware;
		return arr.find(mw => mw instanceof SessionMiddleware)?._session;
	}

	_initSocketServer(server) {
		this.io = new Server(server, this.options);
		this.userSocketIds = new Map();

		if(this.deserializeUser) {
			//Grab the user's session
			let sessionMw = this._findSessionMiddleware();
			if(sessionMw) {
				this.io.use((socket, next) => {
					sessionMw(socket.request, {})
						.then(() => next())
						.catch(e => next(this._handleError(e)));
				});
			}

			//Grab the user
			this.io.use(async (socket, next) => {
				let userId = socket.request.session?.passport?.user;
				if(!userId) return next();

				//Find the user from their credentials and handle any errors
				let user;

				try {
					user = await this.deserializeUser(userId);
				} catch(e) {
					return next(this._handleError(e));
				}

				//Set the user
				if(user) {
					socket.user = user;
					this.userSocketIds.set(user.id, socket.id);
				}

				next();
			});
		}

		this.onServerCreated();
	}

	clearUser(socket) {
		if(socket.user) {
			this.userSocketIds.delete(socket.user.id);
			socket.user = null;
		}
	}

	_handleError(e) {
		if(process.env.NODE_ENV === "production") {
			let eventId = "";

			Sentry.withScope(scope => {
				scope.setTag("source", "SOCKETIO_SERVER");
				eventId = Sentry.captureException(e);
			});

			console.error(`SOCKET.IO ERROR: ${eventId}`);

			return new Error(`Internal Server Error: ${eventId}`);
		} else {
			console.error("SOCKET.IO ERROR:");
			console.error(e);
			process.exit(1);
		}
	}

	wrap(socket, fn) {
		return async (...args) => {
			try {
				await Promise.resolve(fn(...args));
			} catch(e) {
				let ret = this._handleError(e);
				socket.emit("error", ret.message);
				socket.disconnect(true);
			}
		};
	}

	//Method to be overwritten by an extending class
	onServerCreated() {
		/* ... */
	}
};
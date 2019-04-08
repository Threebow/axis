# Axis

## Introduction
Axis is an expressive, unopinionated, and minimal web framework for Node.js. The goal of Axis is to stay out of your way, while lessening the amount of code you need to write for a clean, functional web application. It is built upon a collection of popular libraries and much lower-level frameworks which synergize very well together, as well as some extra magic to handle routing and database stuff.

The combination of these libraries, utilities, and tools allow developers to make complex web applications very quickly and efficiently.

##What it uses
- [Express](https://github.com/expressjs/express): main backend framework for web
- [Objection.js](https://github.com/Vincit/objection.js) and [Knex](https://github.com/tgriesser/knex): ultra-lightweight ORM and query builder
- [Passport](https://github.com/jaredhanson/passport): for authentication
- Your choice of view engine

## How to use
There is no proper documentation for now, as this was mainly intended for me to use as I had noticed I was writing the same backend code over and over for every app I made. However, you should be able to look at the Todo demo project [here](https://github.com/Threebow/axis-todos), it's commented and everything so you should be able to find what you want to do.

Here's a basic example nonetheless:

### Bootstrapping
```js
const {App} = require("axis"),
	  path = require("path");

require("dotenv").config();

let app = new App({
	viewEngineName: "pug",
	viewEngine: require("pug"),
	viewDir: path.join(__dirname, "views"),

	session: {
		secret: process.env.APP_SECRET,
		resave: false,
		saveUninitialized: false
	},

	publicDir: path.join(__dirname, "public"),

	controllers: path.join(__dirname, "./controllers"),
	database: require("./database"),
	routers: [
		require("./routes/web")
	]
});

app.listen(process.env.APP_PORT, () => {
	console.log(`Listening on ${process.env.APP_PORT}`);
});
```

### Routing
```js
const {RouteGroup} = require("axis");

module.exports = ({PagesController, TodoController}, {Todo}) => {
	let app = new RouteGroup("/");

	app.get("/", PagesController.index);

	app.group("/todos", (group) => {
		group.get("/", TodoController.index);
		group.get("/:id", TodoController.view).bind("id", Todo);
	});

	return app;
};
```

### Controllers
```js
const {Controller} = require("axis");

module.exports = class TodoController extends Controller {
	async index() {
		let todos = await this.models.Todo.query();
		return this.render("todos/index", {todos});
	}

	async view(todo) {
		return this.render("todos/view", {todo});
	}
};
```
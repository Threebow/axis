# Axis

Axis is a framework for developing full-stack server-side rendered applications in Node and Vue. It lets you write
your views in type-safe Vue components that share types with your controllers. It also supports full SSR by default,
and will automatically load the files in your `modules` directory according to how you name them. Axis is heavily
inspired by [NestJS](https://nestjs.com/) and [Nuxt](https://nuxt.com/).

Axis has been under development since 2018. For the majority of that time, it has been a JavaScript-only framework.
Only recently has it received a full TypeScript rewrite. Keep in mind that this rewrite is not quite production-ready
yet, so you shouldn't use it for serious stuff.

## Features

- MVC structure
- Vue components as views rendered from controllers
- Fully type-safe with TypeScript and shared types between server and client
- SSR always
- Directory-based module system that automatically loads your code
- Automatic nested layouts within modules
- Middleware
- Unified client + server codebase
- Various standard library features
- Usable for API microservices without rendering, as well as monolithic MPAs
- Well-tested

## Example

In Axis, logical sections of your application are structured as modules. Each module is a folder under the
`src/modules` directory, and they can be nested. There is no need to explicitly define a module or set up
metadata for it after creating a folder for it, you can simply use it as-is.

### DTO

We can define the data that our controller will render as a DTO in our module's DTO file. The name doesn't matter,
as this file doesn't have any implicit behavior (only imported from controller, view, and potentially service files.)
That being said, you should probably follow convention and name it something like `ModuleName.dto.ts`, as follows:

```ts
//// src/modules/Todo/Todo.dto.ts
export type TodoDTO = {
	id: string
	name: string
	content: string
	createdAt: Date
}
```

> #### A note on serialization
> Axis implements `toJson` and `fromJson` functions (these are exported from `@axisjs/core`) that convert to and from
> JSON using JavaScript's underlying `JSON` library, but adds a custom serializer and deserializer that enables one to
> correctly serialize and deserialize JavaScript-specific types that don't have a specific implementation within JSON,
> including `Date` and `bigint`. This allows you to use these types in your DTOs and have them correctly serialized and
> deserialized, instead of dealing with the mess that is `Date.toISOString()` and `new Date(string)`, or having to use
> union types like `DateOrString` within your frontend code.

### Controller

After creating our DTO, we can create our controller that accepts a `GET` request at the root level of the module,
accepting the ID of the todo item to render. In this implementation, `todoRepo.getById(id: string)` returns
`Promise<TodoDTO>` (or throws), but in your code, you can use whatever you'd like to fetch the data. For consistency,
it is recommended to keep the repository file within the module folder, for example, `src/modules/Todo/Todo.repo.ts`.

While controller files are not automatically ran, the root controller for the application must be manually passed to the
Axis `App` instance upon creation, and all other controllers are loaded either from the root controller, or from other
nested controllers deep down the chain that eventually end up mounted to the root controller. As such, the root
controller of the application is considered the entrypoint for the webserver.

```ts
//// src/modules/Todo/Todo.controller.ts
import { Controller, Get, Post, render } from "@axisjs/core"
import { todoRepo } from "./Todo.repo"
import { TodoDTO } from "./Todo.dto"
import { Context } from "@/context"
import { z } from "zod"
import TodoShow from "./Todo.show.vue"

export class TodoController extends Controller {
	@Get("/:id")
	@Params({ id: z.string().uuid() })
	async show(ctx: Context) {
		const todo = await todoRepo.getById(ctx.params.id)
		return render<TodoDTO>(Todo, todo)
	}
}
```

Now, we can mount the todo controller to our root controller:

```ts
//// src/modules/Root.controller.ts
import { Controller, Mount } from "@axisjs/core"
import { TodoController } from "./Todo/Todo.controller";

@Mount("/todos", TodoController)
export class RootController extends Controller {
	/* ... */
}
```

### View

Finally, we can take the data returned from our controller and render it into a Vue component. Note that this re-uses
the same DTO defined in the `Todo.dto.ts` file, meaning we don't need to re-define the types on both our client and our
server. It is also generally necessary to use `import type` when using types as props in the following way, due to
limitations of Vue's SFC compiler.

```vue
<!-- src/modules/Todo/TodoIndex.vue -->
<script setup lang="ts">
	import type { TodoDTO } from "./Todo.dto"

	defineProps<TodoDTO>()
</script>

<template lang="pug">
	p ID: {{ id }}
	p Name: {{ name }}
	p Content: {{ content }}
	p Created At: {{ createdAt.toLocaleString() }}
</template>
```

### Service

At this point, assuming your implementation of `todoRepo.getById(id: string)` works, everything should work as expected
if you navigate to `/todos/some-guid-1234-5678` in your browser.

Now let's say that you wanted to run some simple code in your backend to send email reminders to your users whenever
their todo reaches a due date, for example. Axis provides the concept of a "service file" within a module to solve this
problem. Any file in a module that is named or ends with `service.ts` will be automatically loaded by the bundler, and
executed on boot.

> #### Note on "services"
> It is important to keep in mind the distinction of a service within Axis, and what most other frameworks consider a
> "service". In Axis, service files are strictly files that are automatically ran in the backend context when the
> app boots. It serves as a bootloader for the module. Although you are able to use them to export a "service" class
> that contains isolated units of business logic, consider using repositories first for data access.

Axis also includes several built-in classes that make developing some things a little bit easier. You aren't required
to use them if you don't want to, but they are available for your use if you desire.

```ts
//// src/modules/Todo/Todo.service.ts
import { createLogger, PeriodListener, handleError } from "@axisjs/core"
import { emailService } from "../Email/Email.service" // imaginary service

const log = createLogger("TodoService", "#29C1F6")

// PeriodListener is like setInterval except it handles errors and respects async
new PeriodListener("Todo:ProcessDueDateEmails", 60 * 1000)
	.guard(() => emailService.isReady()) // don't run unless email service is ready
	.on(async () => {
		// TODO: check if any todos are past their due dates, if so, email the creator
		await emailService.doStuff()
	})
	.onError((err: any) => {
		handleError(err, "failed to process due date emails")
	})

```

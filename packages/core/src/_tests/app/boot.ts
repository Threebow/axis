import { createMockApp } from "../fixtures"

const app = await createMockApp(false)
const { host, port } = await app.boot()

console.log(`Axis demo booted on ${host}:${port}!`)

import { createMockApp } from "../fixtures"

const app = createMockApp({ addFixtures: false })
const { host, port } = await app.boot()

console.log(`Axis demo booted on ${host}:${port}!`)

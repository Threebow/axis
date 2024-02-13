import { register } from "node:module"
import { pathToFileURL } from "node:url"

register("extensionless/register", pathToFileURL("./"))

export * from "./classes"
export * from "./decorators"
export * from "./dto"
export * from "./helpers"
export * from "./helpers/backend"
export * from "./stdlib"
export * from "./types"

// useful to expose our fixtures for downstream testing
export * from "./_tests/fixtures"

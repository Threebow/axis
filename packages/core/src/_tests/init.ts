import { use as chaiUse } from "chai"
import sinonChai from "sinon-chai"
import chaiUuid from "chai-uuid"
import chaiString from "chai-string"
import chaiAsPromised from "chai-as-promised"

process.on("unhandledRejection", (e: any) => {
	console.error("Failed to run tests:")
	console.error(e)
	process.exit(1)
})

// install chai plugins
chaiUse(sinonChai)
chaiUse(chaiUuid)
chaiUse(chaiString)
chaiUse(chaiAsPromised)

// load all test files through Webpack
const ctx = require.context("../", true, /\.spec\.ts$/)
ctx.keys().forEach(ctx)

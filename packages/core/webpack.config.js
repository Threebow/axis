import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import nodeExternals from "webpack-node-externals"
import { config } from "dotenv"
import { merge } from "webpack-merge"
import webpack from "webpack"
import { createBaseConfig, createBuildConfig, createNodeConfig } from "./webpack/index.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default (env, argv) => {
	config()

	const SRC = resolve(__dirname, "./src")
	const DIST = resolve(__dirname, "./dist")

	switch (env.TARGET) {
		case "TESTS":
			return createBuildConfig(env, argv, SRC, resolve(DIST, "./tests"), "./_tests/init.ts", "./_tests/app/frontend")

		case "DEMO":
			return createBuildConfig(env, argv, SRC, resolve(DIST, "./demo"), "./_tests/app/boot.ts", "./_tests/app/frontend")

		case "MODULE":
			const NODE = createNodeConfig(createBaseConfig(env, argv, SRC))

			const MODULE = merge(NODE, {
				target: "es2024",
				experiments: {
					outputModule: true
				}
			})

			return [
				// generate build that is only importable on server-side
				merge(MODULE, {
					entry: resolve(SRC, "./index.ts"),
					output: {
						path: resolve(DIST, "./module/server")
					},
					plugins: [
						new webpack.DefinePlugin({
							__SERVER__: true,
							__CLIENT__: false
						})
					],
					externals: [
						nodeExternals({importType: "module"})
					],
					externalsPresets: {node: true}
				}),

				// generate build that is only importable on client-side
				merge(MODULE, {
					entry: resolve(SRC, "./index.client.ts"),
					output: {
						path: resolve(DIST, "./module/client")
					},
					plugins: [
						new webpack.DefinePlugin({
							__SERVER__: false,
							__CLIENT__: true
						})
					]
				})
			]
	}

	throw new Error("Unknown target: " + JSON.stringify(env.TARGET))
}

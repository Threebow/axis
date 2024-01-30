import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { config } from "dotenv"
import CopyPlugin from "copy-webpack-plugin"
import nodeExternals from "webpack-node-externals"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default (env, argv) => {
	config()

	return {
		target: "node20.10",
		mode: argv.mode,
		devtool: "eval-source-map",
		entry: {
			index: "./src/index.ts"
		},
		output: {
			path: resolve(__dirname, "./dist"),
			filename: "index.js",
			clean: true,
			library: {
				type: "module"
			},
			chunkFormat: "module"
		},
		resolve: {
			extensions: [".ts", "..."],
			alias: {
				"@": resolve(__dirname, "./src")
			}
		},
		plugins: [
			new CopyPlugin({
				patterns: [
					{from: "./src/frontend/App.vue", to: "./App.vue"}
				]
			})
		],
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: [
						"babel-loader",
						{
							loader: "ts-loader"
						}
					]
				}
			]
		},
		externals: [
			nodeExternals({importType: "module"})
		],
		externalsPresets: {node: true},
		experiments: {
			outputModule: true
		}
	}
}

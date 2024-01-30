import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { VueLoaderPlugin } from "@threebow/vue-loader"
import { config } from "dotenv"
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
				vue: "vue/dist/vue.esm-bundler",
				"@": resolve(__dirname, "./src")
			}
		},
		plugins: [
			new VueLoaderPlugin()
		],
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: [
						"babel-loader",
						{
							loader: "ts-loader",
							options: {
								appendTsSuffixTo: [/\.vue$/],
								appendTsxSuffixTo: [/\.vue$/]
							}
						}
					]
				},
				{
					test: /\.vue$/,
					use: [
						resolve(__dirname, "./webpack/filename-loader.js"),
						"@threebow/vue-loader"
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

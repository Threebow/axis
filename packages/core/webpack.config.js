import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import nodeExternals from "webpack-node-externals"
import { config } from "dotenv"
import fs from "node:fs"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import { VueLoaderPlugin } from "vue-loader"
import { globbySync } from "globby"
import { merge } from "webpack-merge"
import webpack from "webpack"
import CopyPlugin from "copy-webpack-plugin"
import CssMinimizerPlugin from "css-minimizer-webpack-plugin"
import WebpackAssetsManifest from "webpack-assets-manifest"

const __dirname = dirname(fileURLToPath(import.meta.url))

function fsReadFile(file) {
	// if the file is a directory, parse the relevant index file
	if (fs.statSync(file).isDirectory()) {
		let index = globbySync("./index**.ts", {cwd: file})[0]
		if (index) index = resolve(file, index)

		// make sure the index exists
		if (!index || !fs.existsSync(index)) {
			throw new Error(`Encountered directory import without relevant index file: ${index ?? file}`)
		}

		return fsReadFile(index)
	}

	return fs.readFileSync(file, "utf8")
}

export default (env, argv) => {
	config()

	const DEV = argv.mode === "development"
	const PROD = !DEV

	const SRC = resolve(__dirname, "./src")
	const DIST = resolve(__dirname, "./dist")

	const BASE = {
		mode: argv.mode,
		devtool: "source-map",
		output: {
			chunkFilename: "[name]-[chunkhash].chunk.bundle.js",
			publicPath: "/",
			scriptType: "text/javascript"
		},
		resolve: {
			extensions: [".js", ".ts", "..."]
		},
		plugins: [
			new webpack.DefinePlugin({
				__DEV__: DEV,
				__PROD__: PROD,
				__LAYOUT_REGEX__: "/.+layout\\.vue$/",
				__FRONTEND_INIT_REGEX__: "/.+\\.vue$/"
			}),
			new VueLoaderPlugin(),
			new MiniCssExtractPlugin({
				filename: "[name]-[fullhash].css"
			})
		],
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					include: SRC,
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
					test: /\.m?js$/,
					resolve: {
						fullySpecified: false
					}
				},
				{
					test: /\.vue$/,
					use: [
						"@axisjs/filename-loader",
						{
							loader: "vue-loader",
							options: {
								fs: {
									fileExists: (file) => fs.existsSync(file),
									readFile: (file) => fsReadFile(file),
									realpath: (file) => fs.realpathSync(file)
								}
							}
						}
					]
				},
				{
					test: /\.s?css$/,
					use: [
						DEV ? "vue-style-loader" : MiniCssExtractPlugin.loader,
						"css-loader",
						"sass-loader"
					]
				},
				{
					test: /\.pug$/,
					oneOf: [
						// this applies to `<template lang="pug">` in Vue components
						{
							resourceQuery: /^\?vue/,
							use: ["pug-plain-loader"]
						},
						// this applies to pug imports inside JavaScript
						{
							use: ["raw-loader", "pug-plain-loader"]
						}
					]
				},
				{
					test: /\.(png|jpe?g|gif|svg|ico)$/i,
					oneOf: [
						{
							dependency: {not: ["url"]}, // exclude new URL calls
							use: ["new-url-loader"]
						},
						{
							type: "asset/resource" // emit a separate file
						}
					]
				}
			]
		}
	}

	const NODE = merge(BASE, {
		target: "node20.10",
		output: {
			filename: "index.js",
			library: {
				type: "module"
			},
			chunkFormat: "module"
		},
		externals: [
			nodeExternals({
				importType: "module"
			})
		],
		externalsPresets: {node: true},
		experiments: {
			outputModule: true
		}
	})

	const WEB = merge(BASE, {
		target: "web",
		output: {
			filename: "[name]-[fullhash].bundle.js"
		},
		plugins: [
			new webpack.DefinePlugin({
				__SERVER__: false,
				__CLIENT__: true
			}),
			new WebpackAssetsManifest({
				output: "../assets-manifest.json"
			})
		],
		optimization: {
			minimizer: [
				"...",
				new CssMinimizerPlugin()
			]
		}
	})

	function generateBuildConfig(src, dist, serverEntry) {
		return [
			// Server build
			merge(NODE, {
				entry: resolve(src, serverEntry ?? "./boot.ts"),
				plugins: [
					new webpack.DefinePlugin({
						__SERVER__: true,
						__CLIENT__: false,
						__SRC__: JSON.stringify(resolve(src)),
						__DIST__: JSON.stringify(resolve(dist))
					})
				],
				output: {
					path: resolve(dist, "./backend")
				}
			}),

			// Client build
			merge(WEB, {
				entry: resolve(src, "./frontend/main.ts"),
				output: {
					path: resolve(dist, "./frontend")
				},
				plugins: [
					new CopyPlugin({
						patterns: [
							{
								from: resolve(src, "./frontend/favicon.ico"),
								to: "./favicon-[fullhash].ico"
							}
						]
					})
				]
			})
		]
	}

	switch (env.TARGET) {
		case "TESTS":
			// specify test entry as third parameter
			return generateBuildConfig(resolve(SRC, "./_tests/app"), resolve(DIST, "./tests"), "../init.ts")

		case "DEMO":
			return generateBuildConfig(resolve(SRC, "./_tests/app"), resolve(DIST, "./demo"))

		case "MODULE":
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

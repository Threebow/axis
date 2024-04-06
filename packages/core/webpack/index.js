import fs from "node:fs"
import {globbySync} from "globby"
import {resolve} from "node:path"
import {config} from "dotenv"
import webpack from "webpack"
import {VueLoaderPlugin} from "vue-loader"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import {merge} from "webpack-merge"
import nodeExternals from "webpack-node-externals"
import WebpackAssetsManifest from "webpack-assets-manifest"
import CssMinimizerPlugin from "css-minimizer-webpack-plugin"
import CopyPlugin from "copy-webpack-plugin"
import TerserPlugin from "terser-webpack-plugin";

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

export function createBaseConfig(env, argv, src) {
	config()

	const DEV = argv.mode === "development"
	const PROD = !DEV

	return {
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
					include: src,
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
}

export function createNodeConfig(base) {
	return merge(base, {
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
		},
		optimization: {
			minimizer: [
				new TerserPlugin({
					parallel: true,
					terserOptions: {
						keep_classnames: true
					}
				})
			]
		}
	})
}

export function createWebConfig(base) {
	return merge(base, {
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
}

export function createBuildConfig(
	env, argv, src, dist,
	serverEntry = "./index.ts",
	clientEntryDir = "./frontend"
) {
	const base = createBaseConfig(env, argv, src)
	const node = createNodeConfig(base)
	const web = createWebConfig(base)

	return [
		// Server build
		merge(node, {
			entry: resolve(src, serverEntry),
			output: {
				path: resolve(dist, "./backend")
			},
			plugins: [
				new webpack.DefinePlugin({
					__SERVER__: true,
					__CLIENT__: false,
					__SRC__: JSON.stringify(resolve(src)),
					__DIST__: JSON.stringify(resolve(dist))
				})
			]
		}),

		// Client build
		merge(web, {
			entry: resolve(src, clientEntryDir, "./main.ts"),
			output: {
				path: resolve(dist, "./frontend")
			},
			plugins: [
				new CopyPlugin({
					patterns: [
						{
							from: resolve(src, clientEntryDir, "./favicon.ico"),
							to: "./favicon-[fullhash].ico"
						}
					]
				})
			]
		})
	]
}

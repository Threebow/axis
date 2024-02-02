import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import nodeExternals from "webpack-node-externals"
import { config } from "dotenv"
import fs from "node:fs"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import { VueLoaderPlugin } from "vue-loader"
import { globbySync } from "globby"

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
		target: "node20.10",
		entry: resolve(SRC, "_tests/init.ts"),
		devtool: "source-map",
		output: {
			path: resolve(DIST, "./test"),
			filename: "[name].[contenthash].test.js",
			library: {
				type: "module"
			},
			chunkFormat: "module",
			publicPath: "/",
			scriptType: "text/javascript"
		},
		resolve: {
			extensions: [".js", ".ts", "..."]
		},
		plugins: [
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
				// {
				// 	test: /&setup=true$/,
				// 	use: [
				// 		"@axisjs/filename-loader"
				// 	]
				// },
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
	}

	return [
		// Tests
		BASE
	]
}

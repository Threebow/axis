import { exec as rawExec } from "node:child_process"
import { promisify } from "node:util"
import { resolve } from "node:path"
import { hideBin } from "yargs/helpers"
import { rmSync, statSync } from "node:fs"
import yargs from "yargs"

const exec = promisify(rawExec)

function isDirectory(str: string) {
	try {
		return statSync(str).isDirectory()
	} catch {
		return false
	}
}

function cleanDist(root: string) {
	const dist = resolve(root, "./dist")
	
	if (isDirectory(dist)) {
		console.log("Cleaning build output...")
		rmSync(dist, { recursive: true })
	}
	
	console.log("Build output is clean.")
}

export async function build(cwd: string, prod: boolean) {
	cleanDist(cwd)
	
	console.log("Building...")
	
	const r = await exec(`"node_modules/.bin/webpack" --config=webpack.config.js --mode=${prod ? "production" : "development"}`, {
		cwd,
		
	})
	
	console.log("Built!")
	console.log(r)
	
	/*
		"clean": "rm -rf ./dist",
		"build:types": "pnpm clean && tsc --emitDeclarationOnly",
		"build:dev": "pnpm clean && webpack --config=webpack.config.js --mode=development",
		"build": "pnpm clean && webpack --config=webpack.config.js --mode=production",
		"start": "node ./dist/backend/index.js"
	 */
}

yargs(hideBin(process.argv))
	.command("build <mode>", "Build the project", (builder) => {
		return builder
			.positional("mode", {
				describe: "The build mode",
				choices: ["dev", "prod"]
			})
	}, (argv) => build(process.cwd(), argv.mode === "prod"))
	.parse()

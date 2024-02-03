import type { Scope } from "@sentry/node"
import { DateTime } from "luxon"

const Sentry = __SERVER__ ? await import("@sentry/node") : await import("@sentry/browser")

export function handleError(e: any, tag: string, kill = false, processingMetadata?: any): string {
	console.error("ERROR:", tag)
	console.error(DateTime.now().toLocaleString(DateTime.DATETIME_HUGE_WITH_SECONDS))
	console.error(e)
	
	let id
	
	Sentry.withScope((scope: Scope) => {
		scope.setTag("tag", tag)
		
		if (kill) {
			scope.setLevel("fatal")
		}
		
		if (processingMetadata) {
			scope.setSDKProcessingMetadata(processingMetadata)
		}
		
		id = Sentry.captureException(e)
		console.error("Event ID:", id)
	})
	
	if (kill) {
		process.exit(1)
	}
	
	return id!
}

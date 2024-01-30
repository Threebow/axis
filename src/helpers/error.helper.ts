import { DateTime } from "luxon"
import * as Sentry from "@sentry/node"

export function handleError(e: any, tag: string, kill = false, processingMetadata?: any): string {
	console.error(DateTime.now().toLocaleString(DateTime.DATETIME_HUGE_WITH_SECONDS))
	console.error(tag)
	console.error(e.message)
	console.error(e.stack)
	
	let id
	
	Sentry.withScope((scope) => {
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

/**
 * Represents an error that occurred during an HTTP request.
 */
export type ErrorDTO = {
	/**
	 * The status code of the response.
	 */
	status: number
	
	/**
	 * An internal ID tracking the error message, usually populated by Sentry.
	 */
	eventId?: string
	
	/**
	 * A human-readable message describing the error.
	 */
	extra?: string
}

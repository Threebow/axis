import { fromJson } from "../../helpers"
import { ViewData } from "../../types"
import { expect } from "chai"

export function extractEncodedViewData(input: string): string {
	const str = `window.__ENCODED_VIEW__ = "`
	expect(input).to.include(str, "The provided input does not contain any encoded view data.")
	return input.split(str)[1]!.split("\"")[0]!
}

export function extractAndParseEncodedViewData(input: string): ViewData {
	return fromJson(decodeURIComponent(extractEncodedViewData(input)))
}

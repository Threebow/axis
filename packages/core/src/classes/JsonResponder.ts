import { IResponder, Responder } from "./Responder"
import { toJson } from "../helpers"

export interface IJsonResponder<T> extends IResponder {
	serializeAndSend(data: T): this
}

/**
 * A responder that serializes the given data to JSON before sending it. This is different from returning the object
 * from the controller method directly, because it will use Axis's custom serializer, which handles dates and bigints.
 *
 * The response includes a header `X-Axis-Json: 1` to indicate that the response is this specific kind of json. This
 * is checked on the client side to ensure that the response is properly deserialized.
 */
export class JsonResponder<T> extends Responder implements IJsonResponder<T> {
	serializeAndSend(data: T): this {
		return this
			.send(toJson(data))
			.modify(ctx => ctx.headers.set("X-Axis-Json", "1"))
	}
}

import type { TypedJSONRPCServerAndClient } from "json-rpc-2.0"
import { DTOMember } from "./common"

// not exported from json-rpc-2.0 for some reason, so we have to copy and paste it here
export type JsonRPCMethods = Record<string, (params?: DTOMember) => DTOMember>;

export type WSJsonRPC<ClientMethods extends JsonRPCMethods, ServerMethods extends JsonRPCMethods> = {
	readonly server: TypedJSONRPCServerAndClient<ServerMethods, ClientMethods>
	readonly client: TypedJSONRPCServerAndClient<ClientMethods, ServerMethods>
}

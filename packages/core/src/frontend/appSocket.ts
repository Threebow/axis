import { JSONRPCClient, JSONRPCServer, JSONRPCServerAndClient } from "json-rpc-2.0"
import { JsonRPCMethods, WSJsonRPC } from "../types"
import { createLogger, fromJson, toJson } from "../helpers"

const log = createLogger("AppSocket", "#d2a2ff")

export interface IAppSocket<
	ClientMethods extends JsonRPCMethods,
	ServerMethods extends JsonRPCMethods
> {
	readonly rpc: WSJsonRPC<ClientMethods, ServerMethods>["client"]
	readonly ready: boolean
}

export class AppSocket<
	ClientMethods extends JsonRPCMethods,
	ServerMethods extends JsonRPCMethods
> implements IAppSocket<ClientMethods, ServerMethods> {
	private socket: WebSocket | null = null
	
	private connected = false
	
	readonly rpc = new JSONRPCServerAndClient(
		new JSONRPCServer(),
		new JSONRPCClient((request) => {
			if (!this.socket) {
				throw new Error("Cannot send RPC request to null socket")
			}
			
			if (!this.connected) {
				throw new Error("Cannot send RPC request to disconnected socket")
			}
			
			this.socket.send(toJson(request))
		})
	)
	
	constructor(private readonly wsUrl: string) {
		this.initSocket()
	}
	
	get ready() {
		return this.connected
	}
	
	private initSocket() {
		if (this.socket) {
			throw new Error("Socket already initialized")
		}
		
		// init socket
		this.socket = new WebSocket(this.wsUrl)
		this.socket.addEventListener("open", (e: Event) => this.onOpen(e))
		this.socket.addEventListener("message", (e: MessageEvent) => this.onMessage(e))
		this.socket.addEventListener("close", (e: CloseEvent) => this.onClose(e))
		this.socket.addEventListener("error", (e: Event) => this.onError(e))
	}
	
	// TODO: implement heartbeat
	
	private onOpen(e: Event) {
		this.connected = true
	}
	
	private onMessage(e: MessageEvent) {
		const payload = fromJson(e.data)
		
		this.rpc
			.receiveAndSend(payload)
			.catch(e => {
				log("Got RPC Error!")
				console.error(e)
			})
	}
	
	private onClose(e: CloseEvent) {
		log("onClose", e)
		
		this.connected = false
		this.socket = null
		
		this.initSocket()
	}
	
	private onError(e: Event) {
		log("onError", e)
	}
}

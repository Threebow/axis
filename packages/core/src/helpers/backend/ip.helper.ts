import { IncomingMessage } from "http"

export function resolveIpAddressFromIncomingMessage(request: IncomingMessage): string {
	let ip = request.headers["do-connecting-ip"] ?? request.socket.remoteAddress
	
	if (Array.isArray(ip)) {
		ip = ip[0]
	}
	
	if (!ip) {
		throw new Error("IP address is inaccessible")
	}
	
	return ip
}

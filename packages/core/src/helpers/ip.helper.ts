import { IncomingMessage } from "http"
import isPrivate from "private-ip"

export function resolveIpAddressFromIncomingMessage(request: IncomingMessage): string {
	let ip = request.headers["do-connecting-ip"] ?? request.socket.remoteAddress
	
	if (Array.isArray(ip)) {
		ip = ip[0]
	}
	
	if (!ip) {
		throw new Error("IP address is inaccessible")
	}
	
	if (isPrivate(ip)) {
		throw new Error("Private IP addresses are prohibited.")
	}
	
	return ip
}
import { IncomingMessage } from "http"

export function isIpAddressLocal(ipAddress: string): boolean {
	return /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3})|(172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})|(192\.168\.\d{1,3}\.\d{1,3})$/
		.test(ipAddress)
}

export function resolveIpAddressFromIncomingMessage(request: IncomingMessage): string {
	let ip = request.headers["do-connecting-ip"] ?? request.socket.remoteAddress
	
	if (Array.isArray(ip)) {
		ip = ip[0]
	}
	
	if (!ip) {
		throw new Error("IP address is inaccessible")
	}
	
	if (isIpAddressLocal(ip)) {
		throw new Error("Client IP address cannot be local.")
	}
	
	return ip
}

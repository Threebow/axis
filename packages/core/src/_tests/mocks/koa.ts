import { Duplex, Readable, Writable } from "stream"
import Koa, { Context } from "koa"

export function mockKoaContext(req?: any, res?: any, app?: any): Context {
	const socket = new Duplex()
	req = Object.assign({ headers: {}, socket }, Readable.prototype, req)
	res = Object.assign({ _headers: {}, socket }, Writable.prototype, res)
	req.socket.remoteAddress = req.socket.remoteAddress || "127.0.0.1"
	app = app || new Koa()
	res.getHeader = (k: any) => res._headers[k.toLowerCase()]
	res.setHeader = (k: any, v: any) => {
		res._headers[k.toLowerCase()] = v
	}
	res.removeHeader = (k: any, v: any) => delete res._headers[k.toLowerCase()]
	return app.createContext(req, res)
}

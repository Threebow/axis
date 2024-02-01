import { Context as KoaContext, Next as KoaNext } from "koa"
import HTTPError from "http-errors"
import { ZodError } from "zod"
import { fromZodError } from "zod-validation-error"
import { BaseLocalsDTO, BaseUserDTO, ErrorDTO } from "../dto"
import { AppErrorType, IApp, IContext, isAppError, IUser, Responder } from "../classes"
import { ViewComponent } from "../types"
import { handleError, render } from "../helpers"

/**
 * Handle fatal application-level errors. This should be at the top of the middleware stack and should
 * only be triggered on a truly fatal error. This handler will kill the app when invoked.
 */
export function fatalErrorHandler() {
	return async (ctx: KoaContext, next: KoaNext) => {
		try {
			await next()
		} catch (e) {
			handleError(e, "fatal request error", true, { request: ctx.request })
		}
	}
}

/**
 * Handle generic application-level errors. This should be defined after the fatal error handler, so
 * that koa can catch errors thrown by other middleware.
 */
export function genericErrorHandler<
	// FIXME: how to avoid duplicating this everywhere?
	UserDTO extends BaseUserDTO,
	UserClass extends IUser<UserDTO>,
	LocalsDTO extends BaseLocalsDTO<UserDTO>,
	Context extends IContext<UserDTO, UserClass, LocalsDTO>
>(opts: {
	app: IApp<UserDTO, UserClass, LocalsDTO, Context>
	expose: boolean
	errorPage: ViewComponent
}) {
	return async (koaCtx: KoaContext, next: KoaNext) => {
		try {
			await next()
		} catch (e: any) {
			// expose error details in development
			if (opts.expose) {
				e.expose = true
			}
			
			// create new context for the error response
			const errCtx = opts.app.createContext(koaCtx)
			await errCtx.initialize()
			
			// calculate response status
			const status = e.statusCode ?? e.status ?? 500
			
			// report error to sentry if it's a server error or a bad request
			let eventId: string | undefined = undefined
			if (status === 400 || status >= 500) {
				eventId = handleError(e, "generic request error", false, { request: koaCtx.request })
			}
			
			// construct the relevant error data to pass to client
			const data: ErrorDTO = {
				status,
				eventId,
				extra: e.expose ? e.message : undefined
			}
			
			// decide what we will respond with
			// TODO: type this
			let r: any
			
			// either respond with json data, or render error view, depending on request
			if (errCtx.isJsonRequest) {
				r = new Responder().send(data)
			} else {
				r = render(opts.errorPage, data)
			}
			
			r.setError()
			r.status(status)
			
			// issue the response
			await errCtx.respond(r)
		}
	}
}

export function httpErrorTransformer() {
	return async (koaCtx: KoaContext, next: KoaNext) => {
		try {
			await next()
			
			// if we get here, it means no other middleware has handled the request, so let's throw a 404 error
			// TODO: test if moving it here works
			if (koaCtx.status === 404) {
				throw new HTTPError.NotFound()
			}
		} catch (e: any) {
			// transform zod errors into bad request errors
			if (e instanceof ZodError) {
				const he = new HTTPError.BadRequest(fromZodError(e).toString())
				he.expose = true
				throw he
			}
			
			// transform app errors
			if (isAppError(e)) {
				if (e.type === AppErrorType.NOT_FOUND) {
					throw new HTTPError.NotFound(e.message)
				}
				
				if (e.type === AppErrorType.INVALID_INPUT) {
					throw new HTTPError.BadRequest(e.message)
				}
				
				throw e
			}
			
			// transform prisma not found errors
			if (e?.code === "P2025") {
				throw new HTTPError.NotFound()
			}
			
			throw e
		}
	}
}

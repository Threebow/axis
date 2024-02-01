import { Flasher, IFlasher } from "./Flasher"
import { KVObject } from "../types"
import { IApp } from "./App"
import { IContext } from "./Context"

export interface IRedirector extends IFlasher {
    // redirects to an internal app route
    to(routeName: string, data?: KVObject): this

    // redirects to an external or full route
    toUrl(destination: string): this

    // redirects to the referrer
    back(): this

    // adds a hash to the redirect
    hash(hash: string): this
}

enum RedirectType {
    INTERNAL,
    EXTERNAL,
    BACK
}

type RedirectDestination =
    {
        readonly type: RedirectType.INTERNAL
        readonly routeName: string
        readonly data?: KVObject
        hash?: string
    } |
    {
        readonly type: RedirectType.EXTERNAL
        readonly url: string
    } |
    {
        readonly type: RedirectType.BACK
    }

export class Redirector extends Flasher implements IRedirector {
    private destination?: RedirectDestination

    private setDestination(destination: RedirectDestination) {
        if (this.destination) {
            throw new Error("Redirector: redirect already set")
        }

        this.destination = destination

        return this
    }

    to(routeName: string, data?: KVObject): this {
        return this.setDestination({ type: RedirectType.INTERNAL, routeName, data })
    }

    toUrl(url: string): this {
        return this.setDestination({ type: RedirectType.EXTERNAL, url })
    }

    back(): this {
        // done this way instead of returning this.toUrl("back") in case we need to implement our own back
        // functionality in the future, and we don't want to break the API
        return this.setDestination({ type: RedirectType.BACK })
    }

    hash(hash: string): this {
        if (this.destination?.type !== RedirectType.INTERNAL) {
            throw new Error("Redirector: cannot add hash to non-internal redirect")
        }

        this.destination.hash = hash

        return this
    }

    override async execute(app: IApp, ctx: IContext): Promise<void> {
        // apply flash messages
        await super.execute(app, ctx)

        // ensure destination is set
        if (!this.destination) {
            throw new Error("Redirector: no redirect set")
        }

        if (this.destination.type === RedirectType.INTERNAL) {
            // TODO: resolve and create url from route name, we need to implement route names first
            throw new Error("not yet implemented")
        } else if (this.destination.type === RedirectType.EXTERNAL) {
            // redirect with koa to external url
            ctx.koaCtx.redirect(this.destination.url)
        } else if (this.destination.type === RedirectType.BACK) {
            // pass redirect to koa to send us back
            ctx.koaCtx.redirect("back")
        } else {
            throw new Error("Unknown redirect type?")
        }
    }
}

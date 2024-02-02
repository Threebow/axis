import { DTO, ViewComponent } from "../types"
import { IRedirector, IRenderer, IResponder, Redirector, Renderer, Responder } from "../classes"

export function render<Data extends DTO>(component: ViewComponent, props?: Data): IRenderer<Data> {
	return new Renderer<Data>()
		.render(component, props ?? ({} as Data))
}

export function redirect(url: string): IRedirector {
	return new Redirector()
		.toUrl(url)
}

export function status(code: number): IResponder {
	return new Responder()
		.status(code)
}

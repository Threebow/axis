import { DTO, ViewComponent } from "../types"
import { IRedirector, IRenderer, Redirector, Renderer } from "../classes"

export function render<Data extends DTO>(component: ViewComponent, props?: Data): IRenderer<Data> {
	return new Renderer<Data>()
		.render(component, props ?? ({} as Data))
}

export function redirect(url: string): IRedirector {
	return new Redirector()
		.toUrl(url)
}

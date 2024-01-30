import { DTO, ViewComponent } from "@/types/common"
import { IRenderer, Renderer } from "@/classes/Renderer"
import { IRedirector, Redirector } from "@/classes/Redirector"

export function render<Data extends DTO>(component: ViewComponent, props?: Data): IRenderer<Data> {
	return new Renderer<Data>()
		.render(component, props ?? ({} as Data))
}

export function redirect(url: string): IRedirector {
	return new Redirector()
		.toUrl(url)
}

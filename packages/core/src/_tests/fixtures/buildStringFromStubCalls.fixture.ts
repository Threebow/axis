import { SinonStub } from "sinon";

export function buildStringFromStubCalls(stub: SinonStub): { readonly content: string } {
	let str = ""
	
	stub.callsFake((...args: any[]) => str += args.join("\n") + "\n")
	
	return {
		get content() {
			return str
		}
	}
}

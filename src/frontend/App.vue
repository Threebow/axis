<script setup lang="ts">
	import { isString } from "lodash-es"
	import { computed, ConcreteComponent, h, resolveComponent } from "vue"

	const { layoutFiles, props, locals } = defineProps<{
		file: string
		layoutFiles: string[]
		props: any
		locals: any
	}>()

	export function resolveComponentOrThrow(name: string): ConcreteComponent {
		const comp = resolveComponent(name)

		if (isString(comp)) {
			throw new Error(name + " component not found.")
		}

		return comp
	}

	// FIXME: type this correctly
	function mergeLocalsIntoProps(propDefs: any, locals: any): any {
		if (!propDefs) {
			return {}
		}

		const propsToAdd: any = {}

		for (const i in locals) {
			if (propDefs[i]) {
				propsToAdd[i] = locals[i]
			}
		}

		return propsToAdd
	}

	const vnode = computed(() => {
		const view = resolveComponentOrThrow("AppView")

		let vnode = h(view, mergeLocalsIntoProps(view.props, { ...locals, ...props }))

		layoutFiles
			.forEach((f: string, i: number, a: string[]) => {
				const layout = resolveComponentOrThrow("Layout" + (a.length - i - 1))

				const merged = mergeLocalsIntoProps(layout.props, locals)

				const node = vnode
				vnode = h(layout, merged, () => node)
			})

		return vnode
	})
</script>

<template lang="pug">
	main
		component(:is="vnode")
</template>

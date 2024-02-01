<script setup lang="ts">
	import { isString } from "lodash-es"
	import type { ConcreteComponent } from "vue"
	import { computed, h, resolveComponent } from "vue"
	import { KVObject } from "@"

	const { layoutFiles, props, locals } = defineProps<{
		file: string
		layoutFiles: string[]
		props: any
		locals: any
	}>()

	function resolveComponentOrThrow(name: string): ConcreteComponent {
		const comp = resolveComponent(name)

		if (isString(comp)) {
			throw new Error(name + " component not found.")
		}

		return comp
	}

	function mergeLocalsIntoProps(propDefs: KVObject, locals: KVObject): KVObject {
		if (!propDefs) {
			return {}
		}

		const propsToAdd: KVObject = {}

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

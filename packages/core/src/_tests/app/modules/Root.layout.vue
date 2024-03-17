<script lang="ts" setup>
	import { useLocals } from "../../../composables";
	import type { CustomLocalsDTO } from "./Root.dto";
	import { computed } from "vue";

	const { __APP_VERSION__, user, links } = useLocals<CustomLocalsDTO>()

	// XXX: this is necessary because vue loader is bugged and can't infer the type of `l` when used in `map`
	const mapped = computed(() => {
		// XXX: links are not always defined when this component is mocked. maybe separate app locals and user locals?
		return links?.map(l => l.name).join(",")
	})
</script>

<template lang="pug">
	p.has-color Hello from Root.layout.vue!

	.dashboard
		.dashboard-sidebar
			p Version: {{ __APP_VERSION__}}
			p Logged in as: {{ user?.name ?? "~" }}
			p Links: {{ mapped }}

		.dashboard-body
			slot
</template>

<style lang="scss">
	$padding: 1rem;
	$orange: #d2924f;

	.dashboard, .dashboard-sidebar, .dashboard-body {
		padding: $padding;
	}

	.dashboard-sidebar {
		color: $orange;
	}
</style>

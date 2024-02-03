<script lang="ts" setup>
	type A = {
		__APP_VERSION__: "v0.1.2",
		user?: { name: string }
	}

	defineProps<A>()
</script>

<template lang="pug">
	p.has-color Hello from Root.layout.vue!

	.dashboard
		.dashboard-sidebar
			p Version: {{ __APP_VERSION__}}
			p Logged in as: {{ user?.name }}

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

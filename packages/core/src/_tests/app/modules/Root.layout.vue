<script lang="ts" setup>
	// defineProps<Pick<CustomLocalsDTO, "__APP_VERSION__" | "user" | "links">>()
</script>

<template lang="pug">
	p Hello from Root.layout.vue!

	.dashboard
		.dashboard-sidebar
			//p Version: {{ __APP_VERSION__ }}
			//p Logged in as: {{ user?.name }}

			//a(v-for="link in links", :key="link.name", :href="link.href") {{ link.name }}

		.dashboard-body
			slot
</template>

<style lang="scss" scoped>
	$padding: 1rem;

	.dashboard, .dashboard-sidebar, .dashboard-body {
		padding: $padding;
	}
</style>

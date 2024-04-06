<script setup lang="ts">
	import type { CustomLocalsDTO, CustomUserDTO, RootIndexDTO } from "./Root.dto"
	import { toJson } from "../../../helpers"
	import { useAppLocals, useLocals } from "../../../composables"

	const props = defineProps<RootIndexDTO>()

	const { links } = useLocals<CustomLocalsDTO>()
	const { user } = useAppLocals<CustomUserDTO>()
</script>

<template lang="pug">
	p Hello from Root.vue!
	p All data:

	p UUID: {{ uuid }}

	pre
		code {{ toJson($props) }}

	p User and links:

	pre
		code {{ toJson({user, links}) }}
</template>

<style lang="scss">
	@use "../frontend/main";

	$blue: #38bbff;

	pre code {
		color: $blue;
		background-color: main.$background-color;
	}
</style>

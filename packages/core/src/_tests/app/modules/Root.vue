<script setup lang="ts">
	import type { CustomLocalsDTO, RootIndexDTO } from "./Root.dto"
	import { toJson } from "../../../helpers"

	defineProps<RootIndexDTO & CustomLocalsDTO>()
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

<style scoped lang="scss">
	@use "../frontend/main";

	$blue: #38bbff;

	pre code {
		color: $blue;
		background-color: main.$background-color;
	}
</style>

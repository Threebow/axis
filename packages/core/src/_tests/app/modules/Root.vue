<script setup lang="ts">
	import type { CustomLocalsDTO, RootIndexDTO } from "./Root.dto"
	import { toJson } from "../../../helpers/json.helper"

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

<style lang="scss">
	@use "../frontend/main";

	$blue: #38bbff;

	pre code {
		color: $blue;
		background-color: main.$background-color;
	}
</style>

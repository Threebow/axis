<script setup lang="ts">
	import type { RootIndexDTO } from "./Root.dto"
	import { toJson } from "../../../helpers"

	defineProps<RootIndexDTO>()
</script>

<template lang="pug">
	p Hello from the root component!
	p All data:

	pre
		code {{ toJson($props) }}

	p Individual data:
	p Number: {{ num }}
	p String: {{ str }}
	p Bigint Array: {{ arr }}
	p Date: {{ date }}
</template>

<style scoped lang="scss">
	@use "../frontend/main";

	$blue: #38bbff;

	pre code {
		color: $blue;
		background-color: main.$background-color;
	}
</style>

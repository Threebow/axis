<script lang="ts" setup>
	import { useLocals } from "../../../../composables";
	import type { CustomLocalsDTO } from "../../modules/Root.dto";
	import { toJson } from "../../../../helpers";

	const locals = useLocals<CustomLocalsDTO>()
</script>

<template lang="pug">
	// this is never what you would really do, this is only here so we can test locals is accessible here
	p(v-html="toJson(locals)")
</template>

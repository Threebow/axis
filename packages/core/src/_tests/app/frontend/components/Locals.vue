<script lang="ts" setup>
	import { useAppLocals, useLocals } from "../../../../composables"
	import type { CustomLocalsDTO, CustomUserDTO } from "../../modules/Root.dto"
	import { toJson } from "../../../../helpers"

	const locals = useLocals<CustomLocalsDTO>()
	const appLocals = useAppLocals<CustomUserDTO>()
</script>

<template lang="pug">
	// this is never what you would really do, this is only here so we can test locals is accessible here
	p.locals-wrapper(v-html="toJson({ locals, appLocals })")
</template>

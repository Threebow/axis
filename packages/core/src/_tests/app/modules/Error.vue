<script setup lang="ts">
	import type { ErrorDTO } from "../../../dto"

	defineProps<ErrorDTO>()
</script>

<template lang="pug">
	h1 Error encountered!
	h2 Status: {{ status }}
	h3(v-if="eventId") Event ID: {{ eventId }}
	p(v-if="extra") Extra: {{ extra }}
</template>

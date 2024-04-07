<script lang="ts" setup>
	import { useRoute } from "../../../../composables"

	const route = useRoute()
</script>

<template lang="pug">
	p.route-wrapper {{ route }}
</template>

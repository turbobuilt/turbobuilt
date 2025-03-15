<script setup lang="ts">
const model = defineModel();
</script>
<template>
    <input v-model.number="model" type="number" step="1" />
</template>
<style lang="scss">

</style>
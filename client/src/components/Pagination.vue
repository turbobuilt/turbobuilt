<script setup lang="ts">
import { mdiChevronLeft, mdiChevronRight } from "@mdi/js";
import { defineEmits, defineProps } from "vue";

const props = defineProps<{
    page: number
}>();

const emit = defineEmits(['next','previous']);
</script>
<template>
    <div class="pagination">
        <v-spacer />
        <v-btn icon size="small" :disabled="props.page === 1" @click="emit('previous')">
            <v-icon>{{ mdiChevronLeft }}</v-icon>
        </v-btn>
        <div style="width: 10px" > </div>
        <v-btn icon size="small">
            <v-icon>{{ mdiChevronRight }}</v-icon>
        </v-btn>
    </div>
</template>
<style lang="scss">
.pagination {
    margin-top: 5px;
    display: flex;
    padding: 4px;
}
</style>
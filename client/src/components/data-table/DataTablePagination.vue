<script lang="ts" setup>
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';

const emit = defineEmits(["update:page", "update:perPage", "updated"]);

const props = defineProps<{
    page: number,
    perPage: number
}>()

function pageUpdated(page) {
    emit('update:page', page);
    emit('updated');
}

// const page: any = defineModel("page");
// const perPage = defineModel("perPage");

</script>
<template>
    <div class="data-table-pagination">
        <v-btn icon @click="pageUpdated(page - 1)" :disabled="page === 1" :elevation="0">
            <v-icon>{{ mdiChevronLeft }}</v-icon>
        </v-btn>
        <span class="page-display">{{ page }}</span>
        <v-btn icon @click="pageUpdated(page + 1)" :elevation="0">
            <v-icon>{{ mdiChevronRight }}</v-icon>
        </v-btn>
    </div>
</template>
<style lang="scss">
.data-table-pagination {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 10px;
    .page-display {
        padding: 0 10px;
        font-size: 18px;
        font-weight: bold;
    }
}
</style>
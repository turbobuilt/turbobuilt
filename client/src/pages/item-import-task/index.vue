<script lang="ts" setup>
import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";
import { serverMethods } from "@/lib/serverMethods";
import { Item } from "@/serverTypes/item/Item.model";
import { ItemImport } from "@/serverTypes/itemImport/ItemImport.model";
import { ItemImportTask } from "@/serverTypes/itemImport/ItemImportTask.model";
import { onMounted, reactive } from "vue";

const d = reactive({
    itemImportTasks: null as ItemImportTask[],
    loading: true,
    page: 1,
    perPage: 15
})

async function getItems() {
    let result = await serverMethods.itemImportTask.getItemImportTaskList({ page: d.page, perPage: d.perPage, omitBuiltIn: true });
    d.loading = false;
    if(checkAndShowHttpError(result)) {
        return;
    }
    d.itemImportTasks = result.data.items;
}

onMounted(() => {
    getItems();
});
</script>
<template>
    <div class="item-import-list-page">
        <MainMenu />
        <div v-if="d.loading" class="loading">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
        <div v-else>
            <div class="buttons-row">
                <v-btn to="/item-import-task/new" color="primary">New Import Task</v-btn>
            </div>
            <div class="sites">
                <v-card v-for="itemImport of d.itemImportTasks" :key="itemImport.guid" :to="'/item-import-task/' + itemImport.guid">
                    <v-card-title>{{ itemImport.created }}</v-card-title>
                </v-card>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.item-import-list-page {
    .loading {
        display: flex;
        justify-content: center;
        padding: 50px;
    }
    .buttons-row {
        display: flex;
        justify-content: flex-end;
        padding: 10px;
    }
    .sites {
        padding: 10px;
    }
}
</style>
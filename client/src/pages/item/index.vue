<script lang="ts" setup>
import MainMenu from "@/components/MainMenu/MainMenu.vue";
import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";
import { serverMethods } from "@/lib/serverMethods";
import { Item } from "@/serverTypes/item/Item.model";
import { store } from "@/store";
import { onMounted, reactive } from "vue";

const d = reactive({
    items: null as Item[],
    loading: true,
    page: 1,
    perPage: 15
})

async function getItems() {
    let result = await serverMethods.item.getItemList({ page: d.page, perPage: d.perPage });
    d.loading = false;
    if(checkAndShowHttpError(result)) {
        return;
    }
    d.items = result.data.items;
}

onMounted(() => {
    getItems();
});
</script>
<template>
    <div class="item-list-page">
        <MainMenu />
        <div v-if="d.loading" class="loading">
            <v-progress-circular indeterminate />
        </div>
        <div v-else>
            <div class="buttons-row">
                <template v-if="store.userState.showDeveloperView">
                    <v-btn to="/item-import-task" color="primary" style="margin-right: 10px;">Import CSV</v-btn>
                </template>
                <v-btn to="/item/new" color="primary">New Item</v-btn>
            </div>
            <div class="sites">
                <v-card v-for="item of d.items" :key="item.guid" :to="'/item/' + item.guid" class="row">
                    <v-card-title>{{ item.name }}</v-card-title>
                </v-card>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.item-list-page {
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
        display: flex;
        flex-wrap: wrap;
        .row {
            margin: 5px;
        }
    }
}
</style>
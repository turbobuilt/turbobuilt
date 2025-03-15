<script lang="ts" setup>
import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";
import { serverMethods } from "@/lib/serverMethods";
import { Item } from "@/serverTypes/item/Item.model";
import { ItemPropertyType } from "@/serverTypes/itemPropertyType/ItemPropertyType.model";
import { onMounted, reactive } from "vue";

const d = reactive({
    itemPropertyTypes: null as ItemPropertyType[],
    loading: true,
    page: 1,
    perPage: 15
})

async function getItems() {
    let result = await serverMethods.itemPropertyType.getItemPropertyTypeList({ page: d.page, perPage: d.perPage, omitBuiltIn: true });
    d.loading = false;
    if(checkAndShowHttpError(result)) {
        return;
    }
    d.itemPropertyTypes = result.data.itemPropertyTypes;
}

onMounted(() => {
    getItems();
});
</script>
<template>
    <div class="item-property-type-list-page">
        <MainMenu />
        <div v-if="d.loading" class="loading">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
        <div v-else>
            <div class="buttons-row">
                <v-btn to="/item-property-type/new" color="primary">New Item Property Type</v-btn>
            </div>
            <div class="sites">
                <v-card v-for="itemPropertyType of d.itemPropertyTypes" :key="itemPropertyType.guid" :to="'/item-property-type/' + itemPropertyType.guid">
                    <v-card-title>{{ itemPropertyType.name }}</v-card-title>
                </v-card>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.item-property-type-list-page {
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
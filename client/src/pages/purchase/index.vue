<script lang="ts" setup>
import Pagination from '@/components/Pagination.vue';
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import { Purchase } from '@/serverTypes/payment/purchase/Purchase.model';
import { onMounted, reactive } from 'vue';

const d = reactive({
    purchases: null as Purchase[],
    loading: true,
    page: 1,
    perPage: 15
})

async function getItems(page = d.page) {
    d.loading = true;
    let result = await serverMethods.purchase.getPurchaseList({ page: page || d.page, perPage: d.perPage });
    d.loading = false;
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.purchases = result.data.purchases;
}

onMounted(() => {
    getItems();
});
</script>
<template>
    <div class="purchase-list-page">
        <MainMenu />
        <div v-if="d.loading" class="loading">
            <v-progress-circular indeterminate />
        </div>
        <div v-else>
            <div class="sites">
                <v-card v-for="purchase of d.purchases" :key="purchase.guid" :to="'/purchase/' + purchase.guid" class="row">
                    <v-card-title>{{ purchase?.details?.email }}</v-card-title>
                </v-card>
            </div>
            <Pagination @next="getItems(d.page+1)" @previous="getItems(d.page-1)" :page="d.page" />
        </div>
    </div>
</template>
<style lang="scss">
.purchase-list-page {
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
}
</style>
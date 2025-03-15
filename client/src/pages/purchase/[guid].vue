<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import router from '@/router/router';
import { onMounted, reactive, watch } from 'vue';
import { showAlert, showConfirm } from '@/components/ShowModal/showModal';
import WebsiteProperties from './components/WebsiteProperties.vue';
import { mdiCheck, mdiContentCopy } from '@mdi/js';
import ShowJson from '@/components/ShowJson.vue';
import { Purchase } from '@/serverTypes/purchase/Purchase.model';
import MainMenu from '@/components/MainMenu/MainMenu.vue';

const d = reactive({
    purchase: null as Purchase,
    loading: false,
    saving: false,
    activating: false,
    activated: null,
    saveWebsitePropertyList: null as Function,
    domains: [],
    dkimPublicKeyRecord: "",
    showCopied: false
})

async function getPurchase() {
    console.log("Getting purchase")
    if (router.currentRoute.value.params.guid === "new") {
        d.purchase = new Purchase();
        d.activated = false;
    } else {
        d.loading = true;
        let result = await serverMethods.purchase.getPurchase(router.currentRoute.value.params.guid as string);
        d.loading = false;
        if (checkAndShowHttpError(result)) {
            return;
        }
        d.purchase = result.data.purchase;
        console.log("purchase is", result.data)
    }
}

async function savePurchase() {
    // if (d.saving)
    //     return;
    // d.saving = true;
    // let result = await serverMethods.purchase.savePurchase(d.purchase);
    // // await d.saveWebsitePropertyList();
    // d.saving = false;
    // if (checkAndShowHttpError(result)) {
    //     return;
    // }
    // d.purchase.guid = result.data.guid;
    // if (router.currentRoute.value.params.guid === "new") {
    //     router.replace(`/purchase/${result.data.guid}`);
    // }
    // // getDkimPublicKey();
}

onMounted(() => {
    getPurchase();
});

</script>
<template>
    <div class="purchase-page">
        <MainMenu />
        <div v-if="!d.purchase" class="loading-container">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
        <div v-if="d.purchase">
            <v-card>
                <v-card-title>Purchase</v-card-title>
                <v-card-text>
                    <div v-for="lineItem of d.purchase.cart.lineItems">
                        <div>{{ lineItem.item.name }} - {{  lineItem.quantity }}</div>
                    </div>
                </v-card-text>
            </v-card>
            <v-card>
                <v-card-title>Details</v-card-title>
                <v-card-text>
                    <ShowJson :json="d.purchase.details" />
                </v-card-text>
            </v-card>
        </div>
    </div>
</template>
<style lang="scss">
.purchase-page {
    .v-card {
        margin: 10px;
        margin-bottom: 0;
    }
    .buttons {
        display: flex;
        justify-content: flex-end;
        padding: 10px;
    }
    .loading-container {
        display: flex;
        justify-content: center;
        padding: 50px;
    }
}
</style>
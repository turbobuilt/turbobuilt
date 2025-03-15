<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { computed, reactive, watch } from 'vue';
import { onMounted } from 'vue';
import { serverMethods } from '@/lib/serverMethods';
import { router } from "@/router/router";
import { Item } from '@/serverTypes/item/Item.model';
import SelectWebsites from "./components/SelectWebsites.vue";
import { WebsitePage } from '@/serverTypes/websitePage/WebsitePage.model';
import { WebsitePageItem } from '@/serverTypes/websitePageItem/WebsitePageItem.model';
import { showConfirm } from '@/components/ShowModal/showModal';
import MainMenu from '@/components/MainMenu/MainMenu.vue';


const d = reactive({
    loading: false,
    item: null as Item,
    websitePage: null as WebsitePage,
    websitePageItem: null as WebsitePageItem,
    saving: false,
    deleting: false,
    saveItemPropertyList: new Set<Function>(),
    advanced: true,
    hasChangedIdentifier: false,
    identifierChangeNoticeShown: false
})

async function getItem() {
    if (router.currentRoute.value.params.guid === "new") {
        d.item = new Item();
        d.item.addToAllSites = true;
        d.websitePage = new WebsitePage();
        d.websitePageItem = new WebsitePageItem();
    } else {
        d.loading = true;
        let result = await serverMethods.item.getItem(router.currentRoute.value.params.guid as string);
        d.loading = false;
        if (checkAndShowHttpError(result)) {
            return;
        }
        d.item = result.data.item;
        d.websitePage = result.data.websitePage || new WebsitePage();
        d.websitePageItem = result.data.websitePageItem || new WebsitePageItem();
    }
}

async function saveItem() {
    if (d.saving)
        return;
    if (d.saveItemPropertyList.size > 0) {
        await Promise.all(Array.from(d.saveItemPropertyList).map(save => save()))
    }
    d.saving = true;
    let [saveItemResult, websitePageSaveResult] = await Promise.all([
        serverMethods.item.saveItem(d.item),
        serverMethods.websitePage.saveWebsitePage(d.websitePage)
    ]);
    if (checkAndShowHttpError(saveItemResult) || checkAndShowHttpError(websitePageSaveResult)) {
        d.saving = false;
        return;
    }
    d.websitePageItem.item = saveItemResult.data.guid;
    d.websitePageItem.websitePage = websitePageSaveResult.data.guid;
    d.websitePage.guid = websitePageSaveResult.data.guid;
    d.item.guid = saveItemResult.data.guid;
    let websitePageItemSaveResult = await serverMethods.websitePageItem.saveWebsitePageItem(d.websitePageItem);
    d.websitePageItem.guid = websitePageItemSaveResult.data.websitePageItem.guid;
    d.saving = false;
    if (router.currentRoute.value.params.guid === "new") {
        router.replace(`/item/${d.item.guid}`);
    }
}

async function deleteItem() {
    if (d.deleting)
        return;
    if (await showConfirm({ title: "Delete item", content: "Are you sure you want to delete this item?", confirmText: "Delete" })) {
        d.deleting = true;
        let result = await serverMethods.item.deleteItem(d.item.guid);
        d.deleting = false;
        if (checkAndShowHttpError(result)) {
            return;
        }
        router.replace("/item");
    }
}

function onItemPropertiesInit({ data, websiteItemGuid }) {
    let { saveItemPropertyList } = data;
    d.saveItemPropertyList.add(saveItemPropertyList)
}

const imagesProperty = computed(() => d.item.properties?.find(prop => prop.name === "images"));

async function websitePageIdentifierChanged(value) {
    if (d.item.guid && !d.identifierChangeNoticeShown) {
        d.identifierChangeNoticeShown = true;
        if (!await showConfirm({ title: "Warning", content: "Changing the URL identifier will change the URL of this item.  Are you sure you want to do this?" })) {
            return;
        }
    }
    d.hasChangedIdentifier = true;
    d.websitePage.identifier = value;
}
function nameChanged(value) {
    d.item.name = value;
    if (!d.item.guid && !d.hasChangedIdentifier) {
        d.websitePage.identifier = createPrettyUrl(value);
    }
}

function createPrettyUrl(productName: string): string {
    // Normalize the product name to remove accents and special characters
    const normalized = productName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

    // Convert to lowercase
    const lowercased = normalized.toLowerCase();

    // Replace spaces and non-alphanumeric characters with hyphens
    const hyphenated = lowercased.replace(/[^a-z0-9]+/g, '-');

    // Remove leading and trailing hyphens
    const prettyUrl = hyphenated.replace(/^-+|-+$/g, '');

    return prettyUrl.replace(/-{2,}/g, '-');
}

// Example usage
const productName = "My Awesome Product!";
console.log(createPrettyUrl(productName));  // Output: my-awesome-product

onMounted(async () => {
    await router.isReady();
    getItem();
});
</script>
<template>
    <MainMenu />
    <div class="item-page" v-if="d.item" v-ctrl-s="saveItem">
        <div class="buttons-row">
            <div></div>
            <v-btn color="primary" @click="saveItem">
                <div v-if="!d.saving">Save</div>
                <template v-else>
                    <v-progress-circular indeterminate color="white" :size="18" />
                </template>
            </v-btn>
            <v-spacer />
            <v-btn @click="deleteItem">
                <div v-if="!d.deleting">Delete</div>
                <template v-else>
                    <v-progress-circular indeterminate color="white" :size="18" />
                </template>
            </v-btn>
        </div>
        <v-row>
            <v-col cols="12" md="6">
                <v-text-field :modelValue="d.item.name" @update:modelValue="nameChanged" label="Name"
                    hide-details="auto" />
            </v-col>
            <v-col cols="12" md="6" v-if="d.websitePage">
                <v-text-field :modelValue="d.websitePage.identifier" @update:modelValue="websitePageIdentifierChanged"
                    label="Url Identifier (name of this item in URL)" hide-details="auto" />
            </v-col>
        </v-row>
        <br>
        <template v-if="d.item.guid && d.advanced">
            <SelectWebsites :item="d.item" @init="onItemPropertiesInit" />
        </template>
    </div>
    <div v-else-if="d.loading"
        style="display: flex; justify-content: center; align-items: center; padding: 100px 50px;">
        <v-progress-circular indeterminate />
    </div>
</template>
<style lang="scss">
.item-page {
    padding: 5px;
    overflow: auto;

    .buttons-row {
        display: flex;
        align-items: center;
        padding-bottom: 5px;
    }
}
</style>
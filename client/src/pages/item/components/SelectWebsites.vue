<script lang="ts" setup>
import DataTable from '@/components/data-table/DataTable.vue';
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import { Website } from '@/serverTypes/website/Website.model';
import { Item } from '@/serverTypes/item/Item.model';
import websiteItem from '@/serverTypes/websiteItem';
import { onMounted, reactive, defineEmits, computed } from 'vue';
import ItemProperties from "./ItemProperties.vue";


const props = defineProps<{
    item: Item
}>();

const emit = defineEmits(["init"])

const d = reactive({
    websites: null as { name: string, websiteItem: string, website: string }[],
    loading: false,
    all: false,
    selected: new Set<string>(),
    page: 1,
    perPage: 100,
    selectedWebsite: null
})

async function getWebsites() {
    let result = await serverMethods.item.getWebsiteList(props.item.guid, { page: d.page, perPage: d.perPage });
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.websites = result.data.items;
}

onMounted(() => {
    getWebsites();
})

async function updateWebsiteItem(data) {
    let result = await serverMethods.websiteItem.saveWebsiteItem({
        guid: data.websiteItem,
        website: data.website,
        item: props.item.guid,
        url: data.url
    });
    if (checkAndShowHttpError(result)) {
        return;
    }
    // @ts-ignore
    data.websiteItem = result.data.websiteItem.guid;
}

async function activeToggled(value, data) {
    if (!value && data.websiteItem) {
        let result = await serverMethods.websiteItem.deleteWebsiteItem({
            websiteGuid: null,
            itemGuid: null,
            websiteItemGuid: data.websiteItem
        })
        if (checkAndShowHttpError(result))
            return;
        delete data.websiteItem;
        // count items where identical
        let items = d.websites.filter(item => item.website === data.website);
        if (items.length > 1) {
            d.websites.splice(d.websites.indexOf(data), 1)
        }
    } else if (value && !data.websiteItem) {
        await updateWebsiteItem(data);
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
}

function setSelectedWebsite(website) {
    d.selectedWebsite = website.website;
}

const moreThanOneSite = computed(() => d.websites?.length > 1);
</script>
<template>
    <div class="select-websites-for-item-component">
        <div class="sites-list" v-if="moreThanOneSite">
            <table class="sites-table">
                <tr>
                    <th>Add To Site</th>
                    <th>Properties For Website</th>
                </tr>
                <tr class="website-option-row all-option-row">
                    <td>
                        <v-checkbox density="compact" hide-details="auto" v-model="props.item.addToAllSites" />
                    </td>
                    <td class="website-name" :class="{ active: d.selectedWebsite === null }" @click="setSelectedWebsite({ website: null })"><b>All Sites</b></td>
                </tr>
                <tr v-for="website of d.websites" class="website-option-row" v-if="!props.item.addToAllSites">
                    <td>
                        <v-checkbox density="compact" hide-details="auto" :modelValue="!!website.websiteItem" @update:modelValue="val => activeToggled(val, website)"/>
                    </td>
                    <td class="website-name" :class="{ active: d.selectedWebsite === website.website }" @click="setSelectedWebsite(website)">
                        {{ website.name }}
                    </td>
                </tr>
            </table>
            <div v-if="d.websites?.length == d.perPage">ERROR NOT SHOWING MORE THAN {{ d.perPage }} CONTACT SUPPORT</div>
        </div>
        <ItemProperties :item="props.item" @init="data => emit('init', { data, websiteItemGuid: d.selectedWebsite })" v-show="d.selectedWebsite === null"/>
        <div v-for="website of d.websites" class="website-option-row" v-show="d.selectedWebsite === website.website">
            <ItemProperties :item="props.item" :websiteGuid="website.website" @init="data => emit('init', { data, websiteItemGuid: d.selectedWebsite })" />
        </div>
    </div>
</template>
<style lang="scss">
@import "@/scss/variables.module.scss";
.select-websites-for-item-component {
    display: flex;
    // flex-direction: column;
    // align-items: flex-start;
    .sites-list {
        overflow-y: auto;
        flex-shrink: 0;
        max-width: 250px;
    }
    .website-option-row {
        flex-grow: 1;
        // display: flex;
        // align-items: center;
    }
    .sites-table {
        th {
            padding: 5px 7px;
        }
        td {
            padding: 2px 8px;
        }
        .website-name {
            cursor: pointer;
            transition: .1s all;
            &:hover {
                background: gainsboro;
            }
            &.active {
                background: $primary;
            }
        }
    }
}
</style>
<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import { Website } from '@/serverTypes/website/Website.model';
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { WebsiteProperty } from '@/serverTypes/websiteProperty/WebsiteProperty.model';
import ItemPropertyComponent from '@/pages/item/components/components/ItemPropertyComponent.vue';


const props = defineProps<{
    website: Website;
    websiteGuid?: string;
}>()

const websitePropertiesTable = ref(null);

const emit = defineEmits(["init"])

const d = reactive({
    websiteProperties: null as WebsiteProperty[],
    loading: false,
    newWebsiteProperty: new WebsiteProperty(),
    saving: false
})

async function getWebsiteProperties() {
    d.loading = true;
    let result = await serverMethods.websiteProperty.getWebsitePropertiesForWebsite({
        page: 1,
        perPage: 1000
    }, props.website.guid);
    d.loading = false;
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.websiteProperties = result.data.websiteProperties;
}

const last = computed(() => d.websiteProperties?.at(-1))

async function addWebsitePropertyIfEmpty() {
    let newWebsiteProperty = new WebsiteProperty();
    newWebsiteProperty.website = props.website.guid;
    newWebsiteProperty.website = props.websiteGuid;
    d.websiteProperties.push(newWebsiteProperty);
    nextTick(() => {
        console.log("adding")
        websitePropertiesTable.value.querySelector(`.row-${d.websiteProperties.length - 1} .property-name`).focus()
    })
}

async function saveWebsitePropertyList() {
    if (d.saving)
        return;
    d.saving = true;
    let result = await serverMethods.websiteProperty.saveWebsitePropertyList(props.website.guid, d.websiteProperties, props.websiteGuid);
    d.saving = false;
    if (checkAndShowHttpError(result))
        return;
    d.websiteProperties.forEach((websiteProperty, index) => websiteProperty.guid = result.data[index].guid)
}

emit("init", { saveWebsitePropertyList });

onMounted(() => {
    getWebsiteProperties();
})

async function deleteClicked(websiteProperty: WebsiteProperty, index: number) {
    let sliced = d.websiteProperties.splice(index, 1);
    let response = await serverMethods.websiteProperty.deleteWebsiteProperty(websiteProperty.guid);
    if (checkAndShowHttpError(response)) {
        d.websiteProperties.splice(index, 0, ...sliced);
    }
}

</script>
<template>
    <div class="website-properties">
        <div v-if="d.loading">
            Loading...
        </div>
        <div v-else>
            <div class="website-properties-table" ref="websitePropertiesTable">
                <div class="row">
                    <div>Name</div>
                    <div>Type</div>
                    <div>Value</div>
                </div>
                <ItemPropertyComponent v-for="(websiteProperty, index) in d.websiteProperties" :key="websiteProperty.guid" :item-property="websiteProperty" :class="[`row-${index}`]" @delete-clicked="deleteClicked(websiteProperty, index)"/>
                <div class="row" v-if="!last || last.guid || last.name">
                    <input @focus="addWebsitePropertyIfEmpty()" />
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.website-properties {
    flex-shrink: 1;
    flex-grow: 1;
    min-width: 0;
    .website-properties-table {
        display: table;
        table-layout: fixed;
        width: 100%;
        input {
            border: 1px solid #ccc;
            border-radius: 0;
            padding: 5px 8px;
            line-height: 1;
            max-width: 100%;
        }
        .row {
            display: table-row;
            >* {
                display: table-cell;
                padding: 5px;
                border-bottom: 1px solid #ccc;
                max-width: 100%;
            }
        }
    }
}
</style>
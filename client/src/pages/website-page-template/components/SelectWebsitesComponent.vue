<script lang="ts" setup>
import DataTable from '@/components/data-table/DataTable.vue';
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import { Website } from '@/serverTypes/website/Website.model';
import { WebsitePageTemplate } from '@/serverTypes/websitePageTemplate/WebsitePageTemplate.model';
import websiteWebsitePageTemplate from '@/serverTypes/websiteWebsitePageTemplate';
import { onMounted, reactive } from 'vue';


const props = defineProps<{
    websitePageTemplate: WebsitePageTemplate
}>();

const d = reactive({
    websites: null as { name: string, url: any, websiteWebsitePageTemplate: string, website: string }[],
    loading: false,
    all: false,
    selected: new Set<string>(),
    page: 1,
    perPage: 15
})

async function getWebsites() {
    let result = await serverMethods.websitePageTemplate.getWebsiteList(props.websitePageTemplate.guid, { page: d.page, perPage: d.perPage });
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.websites = result.data.items;
}

onMounted(() => {
    getWebsites();
})

async function updateWebsiteWebsitePageTemplate(data) {
    let result = await serverMethods.websiteWebsitePageTemplate.saveWebsiteWebsitePageTemplate({
        guid: data.websiteWebsitePageTemplate,
        website: data.website,
        websitePageTemplate: props.websitePageTemplate.guid,
        url: data.url
    });
    if (checkAndShowHttpError(result)) {
        return;
    }
    data.websiteWebsitePageTemplate = result.data.websiteWebsitePageTemplate.guid;
}

async function activeToggled(value, data) {
    if (!value && data.websiteWebsitePageTemplate) {
        let result = await serverMethods.websiteWebsitePageTemplate.deleteWebsiteWebsitePageTemplate({
            websiteGuid: null,
            websitePageTemplateGuid: null,
            websiteWebsitePageTemplateGuid: data.websiteWebsitePageTemplate
        })
        if (checkAndShowHttpError(result))
            return;
        delete data.websiteWebsitePageTemplate;
        delete data.url;
        // count items where identical 
        let items = d.websites.filter(item => item.website === data.website);
        if (items.length > 1) {
            d.websites.splice(d.websites.indexOf(data), 1)
        }
    } else if (value && !data.websiteWebsitePageTemplate) {
        await updateWebsiteWebsitePageTemplate(data);
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
}
</script>
<template>
    <div class="select-websites-component">
        <v-checkbox density="compact" v-model="props.websitePageTemplate.addToAllSites" label="Add To All Sites" hide-details="auto" />
        <div v-if="!props.websitePageTemplate.guid">
            <p>Save this page template to add it to sites</p>
        </div>
        <template v-if="!props.websitePageTemplate.addToAllSites && props.websitePageTemplate.guid">
            <DataTable :items="d.websites" :headers="[
                { name: 'Website', value: 'name' },
                { name: 'Show On Site', value: 'websiteWebsitePageTemplate', type: 'checkbox', onUpdateModelValue: activeToggled, alwaysEditable: true },
                { name: 'Url Override', value: 'url', editable: true, type: 'url', enabledSwitch: 'urlOverride' },
            ]" :manySelectable="false" :saveFunction="updateWebsiteWebsitePageTemplate" />
            <DataTablePagination v-if="d.page !== 1 || d.websites?.length === d.perPage" v-model:page="d.page" v-model:perPage="d.perPage" @updated="getWebsites" />
        </template>
    </div>
</template>
<style lang="scss">
.select-websites-component {
    display: flex;
    flex-direction: column;
}
</style>
<script lang="ts" setup>
import DataTable from '@/components/data-table/DataTable.vue';
import DataTablePagination from '@/components/data-table/DataTablePagination.vue';
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import { WebsitePageTemplate } from '@/serverTypes/websitePageTemplate/WebsitePageTemplate.model';
import { onMounted, reactive } from 'vue';


const props = defineProps(["websiteGuid"])

const d = reactive({
    page: 1,
    perPage: 15,
    pages: null as WebsitePageTemplate[],
    showingAddPagesModal: false,
    addMore: {
        page: 1,
        perPage: 15,
        pages: null as WebsitePageTemplate[],
    }
});

onMounted(() => {
    getPages();
});

async function getPages() {
    let result = await serverMethods.websitePageTemplate.getWebsitePageTemplateListForSite(props.websiteGuid, { page: d.page, perPage: d.perPage, websiteGuid: props.websiteGuid });
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.pages = result.data.items;
}


async function getOtherPages() {
    console.log(d)
    let result = await serverMethods.websitePageTemplate.getWebsitePageTemplateList({ websiteGuid: props.websiteGuid, page: d.page, perPage: d.perPage });
    
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.addMore.pages = result.data.items;
}

function showAddPagesModal() {
    d.addMore.page = 1;
    getOtherPages();
    d.showingAddPagesModal = true;
}

async function addWebsitePageTemplate(item: WebsitePageTemplate) {
    // console.log("items are", item);
    // let url = prompt("What url?");
    // if (!url) {
    //     return;
    // }
    let result = await serverMethods.websitePageTemplate.addWebsitePageTemplateToWebsite(props.websiteGuid, item.guid);
    if (checkAndShowHttpError(result)) {
        return;
    }
    getPages();
    getOtherPages();
    d.showingAddPagesModal = false;
}


async function updateWebsiteWebsitePageTemplate(data) {
    console.log("data", data);
    let result = await serverMethods.websiteWebsitePageTemplate.saveWebsiteWebsitePageTemplate({
        guid: data.websiteWebsitePageTemplate,
        website: props.websiteGuid,
        websitePageTemplate: data.guid,
        url: data.url
    });
    if (checkAndShowHttpError(result)) {
        return;
    }
    data.websiteWebsitePageTemplate = result.data.websiteWebsitePageTemplate.guid;
}


// async function activeToggled(value, data) {
//     if (!value && data.websiteWebsitePageTemplate) {
//         let result = await serverMethods.websiteWebsitePageTemplate.deleteWebsiteWebsitePageTemplate({
//             websiteGuid: null,
//             websitePageTemplateGuid: null,
//             websiteWebsitePageTemplateGuid: data.websiteWebsitePageTemplate
//         })
//         if (checkAndShowHttpError(result))
//             return;
//         delete data.websiteWebsitePageTemplate;
//         delete data.url;
//         // count items where identical 
//         let items = d.websites.filter(item => item.website === data.website);
//         if (items.length > 1) {
//             d.websites.splice(d.websites.indexOf(data), 1)
//         }
//     } else if (value && !data.websiteWebsitePageTemplate) {
//         await updateWebsiteWebsitePageTemplate(data);
//     }
//     await new Promise(resolve => setTimeout(resolve, 1000))
// }

</script>
<template>
    <div class="website-page-templates-list">
        <div style="display: flex; justify-content: flex-end; padding: 5px;">
            <v-btn color="primary" @click="showAddPagesModal()">Add Pages</v-btn>
        </div>
        <DataTable :items="d.pages" :headers="[
            { name: 'Name', value: 'name' },
            { name: 'Page Default Url', value: 'defaultUrl', editable: false, type: 'url' },
            { name: 'Url Override', value: 'url', editable: true, type: 'url' },
            // { name: 'Guid', value: 'guid' },
        ]" :manySelectable="true" :saveFunction="updateWebsiteWebsitePageTemplate"/>
        <DataTablePagination v-model:page="d.page" v-model:perPage="d.perPage" @updated="getPages" />
    </div>
    <v-dialog v-model="d.showingAddPagesModal" max-width="800">
        <v-card>
            <v-card-title>Add Pages</v-card-title>
            <v-card-text>
                <!-- <v-text-field v-model="d.value" label="Name" hide-details="auto" /> -->
                <DataTable :manySelectable="true" style="width: 100%;" :items="d.addMore.pages" :headers="[
                    { name: 'Name', value: 'name' },
                    { name: 'Default Url', value: 'defaultUrl', type: 'url' },
                ]" @selected="addWebsitePageTemplate" />
                <DataTablePagination v-model:page="d.addMore.page" v-model:perPage="d.addMore.perPage" @updated="showAddPagesModal" />
                <!-- {{  d.addMore.pages }} -->

                <!-- <DataTable :items="d.addMore.pages" :headers="[
                    { name: 'Website', value: 'name' },
                    { name: 'Show On Site', value: 'websiteWebsitePageTemplate', type: 'checkbox', onUpdateModelValue: activeToggled, alwaysEditable: true },
                    { name: 'Url Override', value: 'url', editable: true, type: 'url' },
                ]" :manySelectable="false" :saveFunction="updateWebsiteWebsitePageTemplate" />
                <DataTablePagination v-if="d.page !== 1 || d.websites?.length === d.perPage" v-model:page="d.page" v-model:perPage="d.perPage" @updated="getWebsites" /> -->
            </v-card-text>
            <v-card-actions>
                <v-btn color="primary">Add</v-btn>
                <v-btn @click="d.showingAddPagesModal = false">Cancel</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<style lang="scss">
.website-page-templates-list {
    .data-table {
        width: 100%;
    }
}
</style>
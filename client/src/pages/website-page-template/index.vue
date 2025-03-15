<script lang="ts" setup>
import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";
import { serverMethods } from "@/lib/serverMethods";
import { WebsitePageTemplate } from "@/serverTypes/websitePageTemplate/WebsitePageTemplate.model";
import { onMounted, reactive } from "vue";

const d = reactive({
    websitePageTemplates: null as WebsitePageTemplate[],
    loading: true,
    page: 1,
    perPage: 15
})

async function getWebsitePageTemplates() {
    let result = await serverMethods.websitePageTemplate.getWebsitePageTemplateList({ page: d.page, perPage: d.perPage });
    d.loading = false;
    if(checkAndShowHttpError(result)) {
        return;
    }
    d.websitePageTemplates = result.data.items;
}

onMounted(() => {
    getWebsitePageTemplates();
});
</script>
<template>
    <div class="website-list-page">
        <MainMenu />
        <div v-if="d.loading" class="loading">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
        <div v-else>
            <div class="buttons-row">
                <v-btn to="/website-page-template/new" color="primary">New Page</v-btn>
            </div>
            <div class="pages">
                <v-card v-for="item of d.websitePageTemplates" :key="item.guid" :to="'/website-page-template/' + item.guid" class="row">
                    <v-card-title>{{ item.name }}</v-card-title>
                </v-card>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.website-list-page {
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
    .pages {
        padding: 10px;
        display: flex;
        flex-wrap: wrap;
        .row {
            margin: 5px;
        }
    }
    .v-card {
        margin-bottom: 10px;
    }
}
</style>
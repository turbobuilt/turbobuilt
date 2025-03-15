<script lang="ts" setup>
import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";
import { serverMethods } from "@/lib/serverMethods";
import { Website } from "@/serverTypes/website/Website.model";
import { onMounted, reactive } from "vue";

const d = reactive({
    websites: null as Website[],
    loading: true,
    page: 1,
    perPage: 15
})

async function getWebsites() {
    let result = await serverMethods.website.getWebsiteList({ page: d.page, perPage: d.perPage });
    d.loading = false;
    if(checkAndShowHttpError(result)) {
        return;
    }
    d.websites = result.data.items;
}

onMounted(() => {
    getWebsites();
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
                <v-btn to="/website/new" color="primary">New Site</v-btn>
            </div>
            <div class="sites">
                <v-card v-for="item of d.websites" :key="item.guid" :to="'/website/' + item.guid">
                    <v-card-title>{{ item.name }}</v-card-title>
                    <v-card-text>{{ item.domain }}</v-card-text>
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
    .v-card {
        margin: 10px;
    }
    .sites {
        padding: 10px;
    }
}
</style>
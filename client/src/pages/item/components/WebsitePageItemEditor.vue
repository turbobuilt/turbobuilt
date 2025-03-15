<script lang="ts" setup>
import { serverMethods } from "@/lib/serverMethods";
import websitePage from "@/serverTypes/websitePage";
import { WebsitePage } from "@/serverTypes/websitePage/WebsitePage.model";
import { WebsitePageItem } from "@/serverTypes/websitePageItem/WebsitePageItem.model";
import { reactive, watch } from "vue"

const props = defineProps<{
    websitePage
}>();

const d = reactive({
    websitePageItem: null as WebsitePageItem,
    websitePage: null as WebsitePage,
    loading: false
});

watch(() => props.websitePage, (newVal, oldVal) => {
    d.websitePageItem = null;
    if (newVal) {

    }
}, { immediate: true });

async function getWebsitePageItem() {
    d.loading = true;
    // let result = await serverMethods.websitePageItem.
}

</script>
<template>
    <div class="website-page-item-component">

    </div>
</template>
<style lang="scss">
.website-page-item-component {

}
</style>
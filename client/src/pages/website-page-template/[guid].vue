<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import router from '@/router/router';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, watch } from 'vue';
import ComponentsList from './components/ComponentsList.vue';
import VueIframe from '@/components/VueIframe/VueIframe.vue';
import { store } from '@/store';
import RenderBlock from './components/RenderBlock.vue';
import { mdiDrag, mdiArrowUp, mdiArrowDown, mdiTrashCan } from '@mdi/js';
import { WebsitePageTemplate } from '@/serverTypes/websitePageTemplate/WebsitePageTemplate.model';
import SelectWebsitesComponent from './components/SelectWebsitesComponent.vue';
import UrlInput from '@/components/url-input/UrlInput.vue';
import { FileSystem } from '@/lib/fileSystem/FileSystem';
import MainMenu from '@/components/MainMenu/MainMenu.vue';


const d = reactive({
    websitePageTemplate: null as WebsitePageTemplate,
    loading: false,
    saving: false,
    value: "ff",
    history: [],
    frame: null,
    activating: false,
    deleting: false
})

const blocks = computed(() => (d.websitePageTemplate?.content?.blocks || []) as (typeof WebsitePageTemplate.prototype.content.blocks[0] & { guid?: string, top?: number, height?: number })[]);

async function getWebsitePageTemplate() {
    d.history = [];
    if (router.currentRoute.value.params.guid === "new") {
        d.websitePageTemplate = new WebsitePageTemplate();
        d.websitePageTemplate.addToAllSites = true;
    } else {
        d.loading = true;
        let result = await serverMethods.websitePageTemplate.getWebsitePageTemplate(router.currentRoute.value.params.guid as string);
        d.loading = false;
        if (checkAndShowHttpError(result)) {
            return;
        }
        d.websitePageTemplate = result.data;
        console.log(d.websitePageTemplate)
    }
}

let historyDebounce = null;
watch(() => d.websitePageTemplate, (newVal) => {
    if (historyDebounce) {
        return;
    }
    historyDebounce = setTimeout(() => {
        d.history.push(JSON.parse(JSON.stringify(newVal)));
        historyDebounce = null;
    }, 1000);
}, { deep: true });

async function saveWebsitePageTemplate() {
    if (d.saving)
        return;
    d.saving = true;
    let result = await serverMethods.websitePageTemplate.saveWebsitePageTemplate(d.websitePageTemplate);
    d.saving = false;
    if (checkAndShowHttpError(result)) {
        return;
    }
    if (router.currentRoute.value.params.guid === "new") {
        router.replace(`/website-page-template/${result.data.guid}`);
        d.websitePageTemplate.guid = result.data.guid;
    }
}

onMounted(async () => {
    await router.isReady();
    getWebsitePageTemplate();
    // listen cmd/ctrl z undo
    window.addEventListener("keydown", checkUndo);
});

onBeforeUnmount(() => {
    window.removeEventListener("keydown", checkUndo);
});

function checkUndo(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (d.history.length > 0) {
            d.websitePageTemplate = d.history.pop();
            e.preventDefault();
        }
    }
}

async function addComponent(component) {
    // console.log(component);
    let realComponent = await FileSystem.getFile(`/${component.workspace}${component.path}`);
    let stringified = JSON.parse(JSON.stringify(component));
    stringified.compiled = new TextDecoder().decode(realComponent.compiled);
    delete stringified.content;
    delete stringified.compiledJs;
    delete stringified.compiledCss; 
    console.log("adding", stringified);
    blocks.value.push({
        guid: crypto.randomUUID(),
        component: stringified,
        data: {}
    });
}

function resized() {
    let top = 0;
    for (let block of blocks.value) {
        block.top = top;
        top += block.height;
    }
}

function moveUp(index) {
    let originalElement = d.frame.contentWindow.document.body.querySelector(`#b-${blocks[index].guid}`);
    let originalTopInParent = originalElement.getBoundingClientRect().top;
    let [block] = blocks.value.splice(index, 1);
    blocks.value.splice(index - 1, 0, block);
    // scroll into view
    nextTick(() => {
        let el = d.frame.contentWindow.document.body.querySelector(`#b-${block.guid}`);
        let newTopInParent = el.getBoundingClientRect().top;
        let diff = newTopInParent - originalTopInParent;
        console.log(diff);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
}

function moveDown(index) {
    let [block] = blocks.value.splice(index, 1);
    blocks.value.splice(index + 1, 0, block);
    nextTick(() => {
        console.log(d.frame.contentWindow.document.body)
        let el = d.frame.contentWindow.document.body.querySelector(`#b-${block.guid}`);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
}


function deleteBlock(index) {
    blocks.value.splice(index, 1);
}

async function deleteWebsitePageTemplate() {
    if (!confirm("Are you sure you want to delete this page?"))
        return;
    if (d.deleting)
        return;
    d.deleting = true;
    let result = await serverMethods.websitePageTemplate.deleteWebsitePageTemplate(d.websitePageTemplate.guid);
    if (checkAndShowHttpError(result))
        return
    d.deleting = false;
    router.back();
}
</script>
<template>
    <div class="website-page-template-page" v-ctrl-s="saveWebsitePageTemplate">
        <MainMenu />
        <template v-if="d.websitePageTemplate">
            <div>
                <div class="info-row">
                    <v-btn color="primary" @click="saveWebsitePageTemplate">
                        <div v-if="!d.saving">Save</div>
                        <template v-else>
                            <v-progress-circular indeterminate color="white" :size="18" />
                        </template>
                    </v-btn>
                    <v-btn color="primary" @click="deleteWebsitePageTemplate">
                        <div v-if="!d.saving">Delete</div>
                        <template v-else>
                            <v-progress-circular indeterminate color="white" :size="18" />
                        </template>
                    </v-btn>
                </div>
                <div class="info-row-1 v-row">
                    <div class="v-col-md-5">
                        <v-text-field v-model="d.websitePageTemplate.name" label="Name" hide-details="auto" />
                    </div>
                    <div class="v-col-md-7">
                        <UrlInput v-model="d.websitePageTemplate.defaultUrl" label="Default URL" />
                    </div>
                </div>
                <SelectWebsitesComponent :website-page-template="d.websitePageTemplate" />
            </div>
            <div class="page-content">
                <!-- <VueIframe class="preview" v-model:frame="d.frame"> -->
                <div style="flex-grow: 1; min-height: 0; overflow-y: auto">
                    <component is="style"> .move-buttons > div { line-height: 1; padding: 4px 6px; cursor: pointer; background: #75B79E; border-radius: 2px; border: 1px solid teal; color: white; margin-left: 10px; font-size: 5px; }
                        .move-buttons > div.disabled { background: #ccc; cursor: not-allowed; pointer-events: none; user-select: none; }
                    </component>
                    <div v-for="(block, index) in blocks" :key="block.guid" :id="`b-${block.guid}`" :style="{ top: block.top + 'px' }">
                        <div style="display: flex; justify-content: flex-end; background: #dedede; padding: 5px;" class="move-buttons">
                            <div @click="moveUp(index)" :class="{ disabled: index === 0 }">
                                <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: currentColor;">
                                    <path d="M12 2L20 9H14V15H10V9H4M20 21H4V19H20V21Z"></path>
                                </svg>
                            </div>
                            <div @click="moveDown(index)" :class="{ disabled: index === d.websitePageTemplate.content.blocks.length - 1 }">
                                <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: currentColor;">
                                    <path d="M12 22L4 15H10V9H14V15H20M4 3H20V5H4V3Z"></path>
                                </svg>
                            </div>
                            <div @click="deleteBlock(index)">
                                <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: white;">
                                    <path :d="mdiTrashCan"></path>
                                </svg>
                            </div>
                        </div>
                        <RenderBlock :block="block" :index="index" @resize="resized" :key="block.guid" />
                    </div>
                </div>
                <!-- </VueIframe> -->
                <div class="toolbar">
                    <ComponentsList @addComponent="addComponent" />
                </div>
            </div>
        </template>
        <div v-else class="loading-container">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
    </div>
</template>
<style lang="scss">
.website-page-template-page {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 0;
    .loading-container {
        display: flex;
        justify-content: center;
        padding: 50px;
    }
    .page-content {
        display: flex;
        flex-grow: 1;
        min-height: 0;
        .preview {
            flex-grow: 1;
        }
        .toolbar {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            min-height: 0;
            width: 300px;
            flex-grow: 0;
            flex-shrink: 0;
            border-left: 1px solid #ccc;
        }
    }
}
</style>
<script lang="ts" setup>
import { reactive, computed, watch } from 'vue'
import { onMounted, onUnmounted } from 'vue'
import router from "@/router/router";
import MonacoVue from "./components/MonacoVue.vue"
import { serverMethods } from "@/lib/serverMethods";
import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";
import RenderSfc from '@/components/RenderSfc.vue';
import VueIframe from '@/components/VueIframe/VueIframe.vue';
import { Workspace } from '@/serverTypes/workspace/Workspace.model';
import { WorkspaceFile } from '@/serverTypes/workspace/WorkspaceFile.model';
import { compileSfc } from '../../lib/compiler/compile';
import { showConfirm } from '@/components/ShowModal/showModal';
import TreeViewFlat from './components/TreeViewFlat.vue';

const props = defineProps(["workspaceFile"]);
const emit = defineEmits(["close"]);

const d = reactive({
    workspaceFile: null as WorkspaceFile,
    workspace: null as Workspace,
    saving: false,
    lastSavedModel: "",
    lastSavedWorkspace: "",
    loading: false,
    editingWorkspaceInfo: false,
    loadingWorkspaceFile: false,
    showingInOtherTab: false,
    workspaceFiles: [] as WorkspaceFile[], // (WorkspaceFile & { children: WorkspaceFile[] })[]
    newWindowAppElement: null as any,
});
let newWindowOpenChecker = null;

const saved = computed(() => d.workspaceFile.content === d.lastSavedModel);

function getFiles(items: WorkspaceFile[], parent: string | null) {
    let files = items.filter(item => item.parent === parent);
    return files.map(file => ({
        ...file,
        children: getFiles(items, file.guid)
    }));
}

let newWindow = null;
onMounted(async () => {
    window.addEventListener("beforeunload", closeNewWindow);
    await router.isReady();
    if (props.workspaceFile) {
        await loadWorkspace(props.workspaceFile.workspace);
        await fileSelected({ path: '', item: props.workspaceFile });
    } else if (router.currentRoute.value.params.guid === 'new') {
        d.workspace = new Workspace();
    } else {
        await loadWorkspace(router.currentRoute.value.params.guid as string);
    }
});
onUnmounted(() => {
    window.removeEventListener("beforeunload", closeNewWindow);
    closeNewWindow();
})

async function closeNewWindow() {
    clearInterval(newWindowOpenChecker);
    newWindowOpenChecker = null;
    if (newWindow) {
        newWindow.close();
    }
}


async function loadWorkspace(guid) {
    d.loading = true;
    let [{ data: workspace }, { data: workspaceFileListResult }] = await Promise.all([
        serverMethods.workspace.getWorkspace(guid),
        serverMethods.workspaceFile.getWorkspaceFileList(guid)
    ]);
    d.loading = false;
    if (checkAndShowHttpError(workspace) || checkAndShowHttpError(workspaceFileListResult))
        return;
    d.workspace = workspace;
    // d.workspaceFiles = getFiles(workspaceFileListResult.items, null)
    d.workspaceFiles = workspaceFileListResult.items;
}

async function saveWorkspace() {
    if (!d.workspace.identifier?.match(/^[a-z0-9\._]+$/)) {
        alert("Identifier must be lowercase letters, numbers, periods, and underscores only.");
        return;
    }
    let json = JSON.stringify(d.workspace);
    if (json === d.lastSavedWorkspace) {
        return;
    }
    // Save data to API
    d.saving = true;
    let response = await serverMethods.workspace.saveWorkspace(d.workspace);
    if (checkAndShowHttpError(response))
        return;
    if (router.currentRoute.value.params.guid === 'new') {
        router.replace({ path: `/workspace/${response.data.guid}` });
        d.workspace.guid = response.data.guid;
        await loadWorkspace(d.workspace.guid);
    }
    d.saving = false;
    d.editingWorkspaceInfo = false;
    d.lastSavedWorkspace = JSON.stringify(d.workspace);
}

async function saveWorkspaceFile() {
    d.saving = true;
    let workspaceFile = JSON.parse(JSON.stringify(d.workspaceFile));
    delete workspaceFile.unsavedChanges;
    let compiled = { js: null, css: null };
    if (d.workspaceFile.path?.toLowerCase().endsWith(".vue")) {
        try {
            compiled = await compileSfc(d.workspace.guid, d.workspaceFile.content, d.workspaceFile.path);
        } catch (err) {
            console.error(err);
        }
    }
    let response = await serverMethods.workspaceFile.saveWorkspaceFile(workspaceFile, { ...compiled, path: d.workspaceFile.path });
    d.saving = false;
    if (checkAndShowHttpError(response))
        return;
    d.workspaceFile.guid = response.data.workspaceFile.guid;
    workspaceFile.unsavedChanges = false;
}

async function fileSelected({ path, item }) {
    if (!item.guid) {
        d.workspaceFile = item;
        return;
    }
    d.loadingWorkspaceFile = true;
    let response = await serverMethods.workspaceFile.getWorkspaceFile(d.workspace.guid, item.guid);
    d.loadingWorkspaceFile = false;
    if (checkAndShowHttpError(response))
        return;
    d.workspaceFile = response.data;
}
function nameUpdated(item: { guid: string, name: string }) {
    if (d.workspaceFile.guid === item.guid) {
        d.workspaceFile.name = item.name
    }
}

const isVueComponent = computed(() => d.workspaceFile?.name?.toLowerCase().endsWith('.vue'));

async function deleteWorkspace() {
    if (await showConfirm({ title: `Are you sure you want to PERMANTENTLY DELETE this ENTIRE WORKSPACE "${d.workspace?.name}" and ALL FILES in it?`, content: "If you are CERTAIN you want to PERMANENTLY DELETE this ENTIRE WORKSPACE AND ALL FILES, continue." })) {
        await serverMethods.workspace.deleteWorkspace(d.workspace.guid);
        router.replace("/workspace");
    }
}
</script>
<template>
    <div class="workspace-page" v-if="d.workspace" v-ctrl-s="() => d.workspaceFile && saveWorkspaceFile()">
        <div class="top-data" v-if="!props.workspaceFile && (!d.workspace?.guid || d.editingWorkspaceInfo)">
            <v-text-field v-model="d.workspace.name" label="Workspace Name" hide-details="auto"></v-text-field>
            <v-text-field v-model="d.workspace.identifier" label="Identifier" placeholder="com.yourcompany.workspacename" hide-details="auto"></v-text-field>
            <v-btn @click="saveWorkspace" color="primary" class="save-button">
                <v-progress-circular v-if="d.saving" indeterminate color="white" :size="25"></v-progress-circular>
                <div v-else>Save</div>
            </v-btn>
            <v-btn @click="deleteWorkspace" class="save-button" v-if="d.workspace?.guid">
                <v-progress-circular v-if="d.saving" indeterminate color="white" :size="25"></v-progress-circular>
                <div v-else>DELETE</div>
            </v-btn>
        </div>
        <div v-else="props.workspaceFile" style="display: flex; padding: 5px; background-color: gainsboro;">
            <v-btn @click='emit("close")' size="small" color="primary">Close</v-btn>
            <v-spacer />
            <v-btn @click='saveWorkspaceFile()' color="primary" size="small">Save</v-btn>
        </div>
        <div v-else class="workspace-header" @click="d.editingWorkspaceInfo = true" :class="{ 'not-editing': !d.editingWorkspaceInfo }">
            <div class="workspace-name">{{ d.workspace.name }}</div>
            <div class="workspace-identifier">{{ d.workspace.identifier }}</div>
        </div>
        <div class="editor-container" v-if="d.workspace.guid">
            <div class="file-browser">
                <TreeViewFlat v-model="d.workspaceFiles" :workspace="d.workspace" @selected="fileSelected" :currentWorkspaceFile="d.workspaceFile" />
            </div>
            <div style="flex-grow: 1;display: flex;flex-direction: column;">
                <div style="display: flex; justify-content: space-between;" v-if="!d.showingInOtherTab">
                    <div></div>
                    <v-btn size="small" color="primary" @click="showInOtherTab()">Open Preview In New Window</v-btn>
                </div>
                <VueIframe style="height: 200px; max-width: 100vw;" v-if="!d.showingInOtherTab">
                    <RenderSfc :sfc="d.workspaceFile?.content" v-if="d.workspaceFile?.content" :workspace-guid="d.workspace.guid" :workspaceFilePath="d.workspaceFile?.path" />
                </VueIframe>
                <VueIframe :element="d.newWindowAppElement" v-else style="height: 0;">
                    <RenderSfc :sfc="d.workspaceFile?.content" v-if="d.workspaceFile?.content" :workspace-guid="d.workspace.guid" :workspaceFilePath="d.workspaceFile?.path" />
                </VueIframe>
                <MonacoVue v-model="d.workspaceFile.content" v-if="d.workspaceFile" />
            </div>
        </div>
    </div>
</template>
<style lang="scss">
@import "@/scss/variables.module.scss";
.workspace-page {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    .files-editor-header {
        background: $primary;
        display: flex;
        justify-content: space-between;
        padding: 0;
        .v-btn {
            border-radius: 0;
        }
    }
    .monaco-vue {
        flex-grow: 1;
    }
    .workspace-header {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        // border-bottom: 1px solid #ccc;
        align-items: center;
        &.not-editing {
            cursor: pointer;
        }
        .workspace-name {
            font-size: 24px;
        }
        .workspace-identifier {
            font-size: 14px;
            color: #666;
        }
    }
    .file-browser {
        padding: 0px;
        background: rgb(39, 39, 39);
    }
    .editor-container {
        display: flex;
        flex-grow: 1;
        .file-browser {
            width: 300px;
        }
    }
    .top-data {
        display: flex;
        justify-content: space-between;
        .v-btn {
            height: auto;
            max-height: none;
            border-radius: 0;
            width: 75px;
        }
    }
}
</style>
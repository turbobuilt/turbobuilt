<script lang="ts" setup>
import { onMounted, ref, defineProps, onBeforeUnmount, reactive, watch, computed } from "vue";
import vscodeHtmlRaw from "./vscode.html?raw";
import { serverMethods } from "@/lib/serverMethods";
import callMethod from "@/lib/callMethod";
import { WorkspaceFile } from "@/serverTypes/workspace/WorkspaceFile.model";
import { Workspace } from "@/serverTypes/workspace/Workspace.model";
import { store } from "@/store";
import { FileSystem } from "@/lib/fileSystem/FileSystem";
import { compileSfc } from "@/lib/compiler/compile";
import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";
import { uploadGeneratedFile } from "../uploadFiles";
import { showAlert } from "../ShowModal/showModal";
import { convertImageToWebP, getImageData } from "@/pages/upload/uploadUtilities";
import AiChatPanel from "./AiChatPanel.vue";  // Import the new component
import { registerWindowFunctions } from "./windowFunctions";

const props = defineProps([]);
// write vscodeHtml to an iframe
const root = ref<HTMLElement | null>(null);
const vscodeHtml = vscodeHtmlRaw.replace(/ORIGIN/g, window.location.origin);

const d = reactive({
    workspaceFile: null as WorkspaceFile,
    workspace: null as Workspace,
    saving: false,
    lastSavedModel: "",
    lastSavedWorkspace: "",
    loading: false,
    previewingFilePath: "",
    openFilePath: "",
    showingPreview: false,
    editingWorkspaceInfo: false,
    loadingWorkspaceFile: false,
    showingInOtherTab: false,
    workspaceFiles: [] as WorkspaceFile[], // (WorkspaceFile & { children: WorkspaceFile[] })[]
    newWindowAppElement: null as any,
    currentPreviewUrl: "",
    editorId: Math.random().toString(),
    chatWidth: 300,
    dragging: false,
    imageProvider: "fal",
    imageModel: "   ",
    openAIApiKey: "",
    falApiKey: localStorage.getItem("falApiKey") || "",
    imagesGenerating: [] as Array<{ tempId: string, shortDescription: string, prompt: string }>,
});
let newWindowOpenChecker = null;
let newWindow = null;

const rootEl = ref<HTMLElement | null>(null);

// consume it
const callMethodChannel = new BroadcastChannel("callMethod");
const callMethodResponseChannel = new BroadcastChannel(`callMethod:response`);
callMethodChannel.onmessage = async function (event) {
    let { id, name, args, options } = event.data;
    try {
        // console.log("SENDING RESPONSE>>>", id);
        let result = await callMethod(name, [...args], options);
        callMethodResponseChannel.postMessage({ id, result });
    } catch (err) {
        console.error("error doing callmethod", err);
        callMethodResponseChannel.postMessage({ id, error: err });
    }
};

// call functions defined in this module
const callFunctionChannel = new BroadcastChannel("callFunction");
const callFunctionResponseChannel = new BroadcastChannel(`callFunction:response`);
callFunctionChannel.onmessage = async function (event) {
    let { id, name, args, options } = event.data;
    try {
        let result;
        if (name === "saveWorkspaceFile") {
            result = await saveWorkspaceFile(args[0], args[1]);
        } else if (name === "getWorkspaceFile") {
            result = await getWorkspaceFile(args[0]);
        } else if (name === "renameWorkspaceFile") {
            result = await renameWorkspaceFile(args[0], args[1]);
        } else if (name === "deleteWorkspaceFile") {
            result = await deleteWorkspaceFile(args[0]);
        } else if (name === "getOrganizations") {
            result = await getOrganizations();
        } else if (name === "getWorkspaces") {
            result = await getWorkspaces();
        } else if (name === "createDirectory") {
            result = await createDirectory(args[0]);
        }

        callFunctionResponseChannel.postMessage({ id, result });
    } catch (err) {
        console.error("error doing callfunction", err);
        callFunctionResponseChannel.postMessage({ id, error: err });
    }
};

const initializedChannel = new BroadcastChannel("vscode:initialized");
initializedChannel.onmessage = async function (event) {

};

const fileSelectedChannel = new BroadcastChannel("fileSelectedChannel");
fileSelectedChannel.onmessage = async function (event) {
    d.openFilePath = event.data.path
};

async function getOrganizations() {
    return store.organizations;
}

async function getWorkspaces() {
    let result = await serverMethods.workspace.getAllWorkspaces();
    if (checkAndShowHttpError(result)) {
        return;
    }
    return result.data;
}

async function createDirectory(path) {
    let result = await FileSystem.createDirectory(path);
    return result;
}

const editor = ref(null);
onMounted(async () => {
    const iframe = document.createElement("iframe");
    iframe.srcdoc = vscodeHtml.replace(/EDITOR_ID/g, d.editorId);
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    root.value?.appendChild(iframe);
    window.addEventListener("beforeunload", closeNewWindow);

    // Register window functions with simplified dependencies
    registerWindowFunctions({
        updateFileInEditor: (path, content) => updateFileInEditor(path, content),
        d // Pass the reactive d object directly
    });
});


onBeforeUnmount(() => {
    callMethodChannel.close();
    callFunctionChannel.close();
    callFunctionResponseChannel.close();
    fileSelectedChannel.close();
    window.removeEventListener("beforeunload", closeNewWindow);
    closeNewWindow();
});

async function closeNewWindow() {
    clearInterval(newWindowOpenChecker);
    newWindowOpenChecker = null;
    if (newWindow) {
        newWindow.close();
    }
}

watch(() => d.showingInOtherTab && d.currentPreviewUrl, (newVal) => {
    if (d.showingInOtherTab && d.currentPreviewUrl) {
        // set url
        let newUrl = window.location.origin + d.currentPreviewUrl;
        if (newWindow.location.href !== newUrl) {
            newWindow.location.href = newUrl;
        } else
            newWindow.location.reload();
    }
});

function showInOtherTab() {
    if (newWindowOpenChecker) {
        clearInterval(newWindowOpenChecker);
        newWindowOpenChecker = null;
    }
    newWindow = window.open(window.location.origin + d.currentPreviewUrl, "_blank", "");
    console.log("url is", window.location.origin + d.currentPreviewUrl)
    d.showingInOtherTab = true;
    newWindowOpenChecker = setInterval(() => {
        if (newWindow.closed) {
            d.newWindowAppElement = null;
            d.showingInOtherTab = false;
        }
    }, 4000);
}

async function getWorkspaceFile(path) {
    let result = await FileSystem.getFile(path);
    if (result.exists === false) {
        return { exists: false };
    }
    d.workspaceFile = result;
    return result.content;
}

async function saveWorkspaceFile(path: string, content: any) {
    console.log("saving file")
    d.saving = true;
    let compiled = null, dependencies = null;

    if (path?.toLowerCase().endsWith(".vue")) {
        if (content) {
            try {
                let contentString = new TextDecoder().decode(content);
                let result = await compileSfc(contentString, path, { varName: "fullComponent" });
                console.log("Compiled result", result)
                compiled = result.compiled;
                dependencies = result.dependencies;
            } catch (err) {
                compiled = new TextEncoder().encode("");
                console.error(err);
            }
        } else {
            compiled = new TextEncoder().encode("");
        }
    }
    // wait 10 seconds
    let result = await FileSystem.saveFile(path, content, compiled, dependencies || new Set<string>());
    try {
        await recompileDependentComponents(result.data.dependentComponents);
        // make sure to compile
        renderPreview();
    } catch (err) {
        console.error("Error recompiling", err);
    }
    return result;
}
async function renameWorkspaceFile(path, newPath) {
    let result = await FileSystem.renameFile(path, newPath);
    return result;
}
async function deleteWorkspaceFile(path) {
    let result = await FileSystem.deleteFile(path);
    return result;
}

async function recompileDependentComponents(dependentComponentPaths, depth = 0) {
    if (!dependentComponentPaths.length)
        return;
    if (depth > 500) {
        throw new Error("Too deep of a dependency tree");
    }
    await Promise.all(dependentComponentPaths.map(async (path) => {
        console.log("recompiling", path);
        let getFileResult = await FileSystem.getFile(path);
        let contentString = new TextDecoder().decode(getFileResult.content);
        let compileResult = await compileSfc(contentString, path, { varName: "fullComponent" });
        let result = await FileSystem.saveFile(path, (getFileResult as any).content, compileResult.compiled, compileResult.dependencies);
        await recompileDependentComponents(result.data.dependentComponents, depth + 1);
    }));
}

async function selectPreviewFile(path = null) {
    d.previewingFilePath = path || d.openFilePath;
    await renderPreview();
    showInOtherTab()
}

async function renderPreview() {
    if (!d.previewingFilePath)
        return;
    d.currentPreviewUrl = null;
    await new Promise(res => setTimeout(() => {
        d.currentPreviewUrl = `/component-preview${d.previewingFilePath}?authToken=${store.authToken}`;
        res(null);
    }, 100));
}

const currentFileName = computed(() => {
    if (!d.openFilePath)
        return "";
    return d.openFilePath.split("/").pop();
});

// Add listener for file update broadcasts
const fileUpdateChannel = new BroadcastChannel("updateFile");
fileUpdateChannel.onmessage = (event) => {
    const { uri, file, url } = event.data;
    if (uri === d.openFilePath) {
        console.log("Received file update for", uri);
        // Possibly trigger refresh preview or update the editor state here.
    }
};

const pluginFunctionChannel = new BroadcastChannel("pluginFunction");

function updateFileInEditor(path, content) {
    pluginFunctionChannel.postMessage({
        id: Math.random().toString(),
        name: "updateFile",
        args: [path, new TextEncoder().encode(content)],
        options: {}
    });
}
</script>
<template>
    <div class="editor-container" ref="rootEl">
        <div ref="editor"></div>
        <div style="display: flex;flex-direction: column;" v-if="!d.showingInOtherTab">
            <div style="display: flex; padding: 2px;">
                <v-btn size="small" color="primary" @click="selectPreviewFile()"
                    v-if="d.openFilePath && d.previewingFilePath !== d.openFilePath">Preview {{ currentFileName
                    }}</v-btn>
                <v-spacer />
                <div style="display: flex; justify-content: space-between;"
                    v-if="!d.showingInOtherTab && d.currentPreviewUrl">
                    <div></div>
                    <v-btn size="small" color="primary" @click="showInOtherTab()">Open Preview In New Window</v-btn>
                </div>
            </div>
            <!-- <iframe :src="d.currentPreviewUrl" ref="mainIframe" style="max-width: 100vw; flex-grow: 1; border: none; outline: none;"></iframe> -->
        </div>
        <div class="editors-container">
            <div class="vs-code-web" ref="root"></div>
            <!-- add resizer handle -->
            <div class="editor-resizer" :class="{ dragging: d.dragging }" draggable="true">
            </div>
            <!-- Replace the AI chat panel with the new component -->
            <AiChatPanel :d="d" :open-file-path="d.openFilePath" :update-file-in-editor="updateFileInEditor" />
        </div>
    </div>
</template>
<style lang="scss">
@import "./CodeEditor.scss";
</style>
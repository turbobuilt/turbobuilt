<script setup lang="ts">
import { WorkspaceFile } from '@/serverTypes/workspace/WorkspaceFile.model';
import { mdiFile, mdiFolder } from '@mdi/js';
import { reactive } from 'vue';
import createNewVueFile from '../createNewVueFile';
import { Workspace } from '@/serverTypes/workspace/Workspace.model';
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';

const props = defineProps<{
    modelValue: WorkspaceFile[],
    workspace: Workspace,
    currentWorkspaceFile: WorkspaceFile
}>();

const emit = defineEmits(["selected"])

const data = reactive({
    selected: null as WorkspaceFile,
    editing: null as WorkspaceFile,
    tempName: ""
})

function getIndent(item: WorkspaceFile) {
    return item.path.split("/").length * 10 + "px"
}
function getName(item: WorkspaceFile) {
    return item.path.split("/").at(-1);
}
function clicked(item: WorkspaceFile) {
    if (data.selected == item) {
        data.tempName = getName(item)
        data.editing = item;
        return;
    }
    data.selected = item;
    if (item.type === "dir")
        return;
    emit('selected', { path: item.name, item })
}
function dirname(path = "") {
    if (path.endsWith("/"))
        return path;
    return path.split("/").slice(0,-1).join("/")
}
async function addFileOrDir(type: "file" | "dir") {
    console.log("data.selected", data.selected)
    let path = "new";
    if (data.selected) {
        path = (data.selected.type === 'dir' ? data.selected.path : dirname(data.selected.path)) + "/new";
    }
    let entry = {
        name: '',
        type: type,
        workspace: props.workspace.guid,
        content: "",
        path: path
    };
    console.log(entry.path)
    if (type === "file") {
        entry = Object.assign(createNewVueFile({ type, workspace: props.workspace.guid }), entry)
    }
    console.log(entry)
    props.modelValue.unshift(entry);
    props.modelValue.sort((a,b) => a.path < b.path ? -1 : 1);
    data.editing = entry;
    data.selected = entry;
    await saveWorkspaceFilePath(entry);
    clicked(entry);
}

function nameChanged(item: WorkspaceFile, event) {
    item.path = item.path.replace(/[^\/]*$/, event.target.value);
}

async function nameBlurred() {
    data.editing.path = data.editing.path.replace(/[^\/]*$/, data.tempName);
    await saveWorkspaceFilePath(data.editing);
    if (data.editing.guid === props.currentWorkspaceFile?.guid) {
        props.currentWorkspaceFile.path = data.editing.path;
    }
    data.editing = null;
}

async function saveWorkspaceFilePath(item: WorkspaceFile) {
    let response = await serverMethods.workspaceFile.saveWorkspaceFileMetadata(item);
    if (checkAndShowHttpError(response))
        return;
    item.guid = response.data.workspaceFile.guid;
}

async function itemBlurred() {
    data.selected = null;
}
</script>
<template>
    <div class="tree-view-flat">
        <div class="files-editor-header">
            <v-btn style="border-right: 0px solid gray;" size="small" :elevation="0" @click="addFileOrDir('file')" color="primary" class="save-button">
                <v-icon :icon="mdiFile"></v-icon>
                New File
            </v-btn>
            <v-btn size="small" :elevation="0" @click="addFileOrDir('dir')" color="primary" class="save-button">
                <v-icon :icon="mdiFolder"></v-icon>
                New Folder
            </v-btn>
        </div>
        <div class="tree-view-item" v-for="item of props.modelValue" :style="{ marginLeft: getIndent(item) }"
            :class="{ selected: data.selected === item }"
            @click.stop="clicked(item)"
            @blur="itemBlurred()"
            tabindex="1"
            >
            <v-icon :icon="item.type === 'file' ? mdiFile : mdiFolder" :size="19"/>
            <div v-if="data.editing !== item">{{ getName(item) }}</div>
            <input @blur="nameBlurred" style="color:white;" v-else v-model="data.tempName" autofocus="true" />
        </div>
    </div>
</template>
<style lang="scss">
.tree-view-flat {
    color: white;
    .tree-view-item {
        display: flex;
        align-items: center;
        .v-icon {
            margin-right: 5px;
        }
        &.selected {
            background: rgb(88, 88, 88);
        }
    }
}
</style>
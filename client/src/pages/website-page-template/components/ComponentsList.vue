<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import { onMounted, reactive } from 'vue';
import ComponentListItem from './ComponentListItem.vue';
import EditWorkspaceFileModal from './EditWorkspaceFileModal.vue';
const emit = defineEmits(['addComponent']);

const d = reactive({
    components: [],
    loading: false,
    search: '',
    page: 1,
    perPage: 15,
    selectedIndex: -1,
    showingNewModal: false,
    newWorkspaceFile: null,
    selectedWorkspaceGuid: null,
    workspaces: null
})

async function getComponents() {
    d.loading = true;
    let result = await serverMethods.workspaceFile.searchWorkspaceFile(d.search, { page: d.page, perPage: d.perPage, workspaceGuid: d.selectedWorkspaceGuid });
    d.loading = false;
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.components = result.data.items;
}

onMounted(() => {
    getComponents();
    getWorkspaces();
})

function componentClicked(index) {
    d.selectedIndex === index ? d.selectedIndex = -1 : d.selectedIndex = index
}
function addComponent(component) {
    emit('addComponent', component);
}
function newClicked() {

}

async function getWorkspaces() {
    let result = await serverMethods.workspace.getWorkspaceList();
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.workspaces = result.data.items;
}

</script>
<template>
    <div class="components-list">
        <div class="d-flex">
            <v-text-field v-model="d.search" placeholder="Search" hide-details="auto" />
            <v-btn class="new-button" color="primary" @click="newClicked">New</v-btn>
        </div>
        <!-- <v-select v-model="d.selectedWorkspaceGuid" :items="d.workspaces" item-text="name" item-value="guid" label="Workspace" @change="getComponents" /> -->
        <select v-model="d.selectedWorkspaceGuid" @change="getComponents" class="workspace-select">
            <option value="">Select Workspace</option>
            <option v-for="workspace of d.workspaces" :value="workspace.guid">{{ workspace.name }}</option>
        </select>
        <div v-if="d.selectedWorkspaceGuid" class="components">
            <div v-for="(component, index) of d.components">
                <ComponentListItem :component="component" :selected="d.selectedIndex === index" @selected="componentClicked(index)" @close="d.selectedIndex = -1" @add="addComponent(component)" @component-updated="data => d.components[index] = data" />
            </div>
        </div>
        <template v-if="d.newWorkspaceFile">
            <EditWorkspaceFileModal v-model="d.showingNewModal" :workspaceFile="d.newWorkspaceFile" />
        </template>
    </div>
</template>
<style lang="scss">
.components-list {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 0;
    .components {
        overflow-y: auto;
    }
    .new-button.v-btn.v-btn--density-default {
        height: auto;
        max-height: none;
    }
    .workspace-select {
        width: 100%;
        padding: 5px;
        border: 1px solid silver;
        background: whitesmoke;
    }
}
</style>
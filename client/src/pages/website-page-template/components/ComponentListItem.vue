<script lang="ts" setup>
import { reactive, watch } from 'vue';
// import MonacoVue from '@/components/MonacoVue.vue';
import WorkspaceEditor from "@/pages/workspace/[guid].vue";
import { serverMethods } from '@/lib/serverMethods';
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import EditWorkspaceFileModal from './EditWorkspaceFileModal.vue';

const props = defineProps(['component', 'selected']);
const emit = defineEmits(['close', 'selected', 'add', 'componentUpdated']);

const d = reactive({
    showingEditModal: false
})

function showEditModal() {
    d.showingEditModal = true;
}

watch(() => d.showingEditModal, async (val) => {
    if (!val) {
        // emit('close');
        let result = await serverMethods.workspaceFile.getWorkspaceFile(props.component.workspace, props.component.guid);
        if (checkAndShowHttpError(result))
            return;
        emit('componentUpdated', result.data);
    }
})

</script>
<template>
    <div class="component-display" @click="event => emit('selected', event)" @blur="emit('close')" tabindex="0">
        {{ component.path.split("/")?.at(-1) }}
        <div class="overlay" :style="{ opacity: selected ? 1 : 0, zIndex: selected ? 10 : -1 }">
            <div class="btn" @click="$emit('add')">Add</div>
            <v-spacer></v-spacer>
            <div class="btn" @click="showEditModal()">Edit</div>
        </div>
    </div>
    <EditWorkspaceFileModal v-model="d.showingEditModal" :workspace-file="props.component" />
</template>
<style lang="scss">
@import "@/scss/variables.module.scss";
.edit-component-modal {
    .v-overlay__content {
        margin: 0;
        max-width: none;
        max-height: none;
        width: auto;
    }
}
// .component-display-click-background {
//     position: fixed;
//     top: 0;
//     left: 0;
//     right: 0;
//     bottom: 0;
//     z-index: 4;
// }
.component-display {
    padding: 10px;
    border-bottom: 1px solid #ccc;
    position: relative;
    z-index: 9;
    cursor: pointer;
    .overlay {
        user-select: none;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.1);
        display: flex;
        // justify-content: center;
        padding: 5px;
        align-items: center;
        color: white;
        font-size: 24px;
        z-index: 10;
        transition: opacity 0.1s;
        .btn {
            font-size: 15px;
            padding: 5px 10px;
            background: $primary;
        }
    }
}
</style>
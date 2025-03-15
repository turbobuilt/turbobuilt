<script lang="ts" setup>
import { computed, defineProps, watch } from 'vue'
import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";
import { serverMethods } from "@/lib/serverMethods";

const props = defineProps(["item"]);
const emit = defineEmits(["name-updated"])

function toggleOpen(item: any) {
    if (item.children) {
        item.open = !item.open;
    }
}

watch(() => props.item.content, (newVal, oldVal) => {
    if(newVal !== oldVal) {
        props.item.unsavedChanges = true;
    }
})

async function saveWorkspaceFileName(item: any) {
    let response = await serverMethods.workspaceFile.saveWorkspaceFileName(item.guid, item.name);
    if (checkAndShowHttpError(response))
        return;
    emit('name-updated', item)
}
</script>
<template>
    <div class="tree-view-item" @click="toggleOpen(item)">
        <span v-if="item.children">📁</span>
        <span v-else>📄</span>
        <span style="margin-left: 5px;">
            <input style="color:white;" v-model="item.name" @blur="saveWorkspaceFileName(item)"/>
        </span>
    </div>
</template>
<style lang="scss">
.tree-view-item {}
</style>
<script lang="ts" setup>
import { serverMethods } from '@/lib/serverMethods';
import { store } from '@/store';
import { onBeforeUnmount, onMounted, reactive } from 'vue';

const d = reactive({
    workspace: null
})

onMounted(async () => {
    let result = await serverMethods.workspace.getDefaultWorkspace();
    d.workspace = result.data.workspace;
    store.mainEditorCurrentWorkspaceGuid = d.workspace.guid;
    console.log("mainEditorCurrentWorkspaceGuid", store.mainEditorCurrentWorkspaceGuid);

    const commandChannel = new BroadcastChannel("commandChannel");
    commandChannel.postMessage({ command: "vscode:open", args: [`memfs:/`] });
    store.showMainEditor = true;
});

onBeforeUnmount(() => {
    store.showMainEditor = false;
});
</script>
<template>
    <!-- <div class="loading">Editor Loading</div> -->
</template>
<style lang="scss">
.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100%;
    font-size: 2rem;
}
</style>
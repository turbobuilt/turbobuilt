import { WorkspaceFile } from "@/serverTypes/workspace/WorkspaceFile.model";
import { da } from "vuetify/locale";

export default function createNewVueFile(data) {
    const value = `<script setup>
import { reactive } from "vue";
import { getUpload, registerUploads } from "@turbobuilt/tools";

const data = reactive({

})

registerUploads([
    // { type: "image", objectId: "main-image" }
])

</script>
<template>
    <div class="component-name">
        <!-- <img src="getUpload({ id: 'main-image', index: 0}).url" /> -->
    </div>
</template>
<style lang="scss">
.component-name {

}
</style>`;
    let workspaceFile = new WorkspaceFile();
    workspaceFile.content = value;
    Object.assign(workspaceFile, data);
    return workspaceFile;
}
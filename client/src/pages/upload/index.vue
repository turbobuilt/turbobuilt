<script lang="ts" setup>
import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";
import { serverMethods } from "@/lib/serverMethods";
import { Item } from "@/serverTypes/item/Item.model";
import { onMounted, reactive, ref } from "vue";
import DataTable from "@/components/data-table/DataTable.vue";
import { showAlert, showConfirm } from "@/components/ShowModal/showModal";
import { uploadFilePut } from "@/lib/uploadFile";
import { formatBytes } from "@/lib/formatBytes";
import { getUploadLink } from "@/lib/getUploadLink";
import { Upload } from "@/serverTypes/upload/Upload.model";
import { mdiTrashCan, mdiTrashCanOutline } from "@mdi/js";
import { resizeImages } from "./uploadUtilities";
// import resize from "@jsquash/resize";
// import { encode } from "@jsquash/webp";

const d = reactive({
    uploads: null as Item[],
    loading: true,
    page: 1,
    perPage: 15,
    hovering: false,
    uploadProgress: [] as { percent?: number, complete?: boolean, name?: string }[],
    preparingUpload: false
})

async function getItems() {
    let result = await serverMethods.upload.getUploadList({ page: d.page, perPage: d.perPage });
    d.loading = false;
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.uploads = result.data.items;
}

function dragOver(e: DragEvent) {
    e.preventDefault();
    d.hovering = true;
}

function dragLeave(e: DragEvent) {
    e.preventDefault();
    d.hovering = false;
}

function drop(e: DragEvent) {
    console.log("dropped")
    e.preventDefault();
    e.stopPropagation();
    d.hovering = false;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        uploadFiles(files);
    }
}

const root = ref<HTMLElement>(null);
function showFileSelect() {
    if (!root.value) return;
    const input = root.value.querySelector('input.upload-input');
    if (input) root.value.removeChild(input);
    let newElement = document.createElement('input');
    newElement.className = "upload-input";
    newElement.type = "file";
    newElement.multiple = true;
    newElement.style.display = "none"
    newElement.onchange = filesChanged;
    root.value.appendChild(newElement);
    newElement.click();

}

async function filesChanged(event: Event) {
    const SIZE_LIMIT = 10 * 1024 * 1024; // 10MB in bytes
    const files = (event.target as HTMLInputElement).files;

    if (files && files.length) {
        const largeFiles = Array.from(files).filter(file => file.size > SIZE_LIMIT);
        if (largeFiles.length) {
            showAlert({ title: "The file is too big", content: ". limit is " + SIZE_LIMIT / 1024 / 1024 + "mb" })
            return;
        }
        const resized = await resizeImages(Array.from(files));
        uploadFiles(Array.from(resized));
    }
}

async function uploadFiles(files: File[]) {
    d.uploadProgress = [];
    d.preparingUpload = true;
    let result = await serverMethods.upload.getUploadSignedPutUrlList(files.map(file => {
        return {
            contentType: file.type,
            name: file.name,
            size: file.size,
            metadata: {

            }
        }
    }));
    d.preparingUpload = false;
    if (checkAndShowHttpError(result)) {
        return;
    }
    let uploadsInfo = result.data;
    d.uploadProgress = result.data.map(item => { return { percent: 0, name: item.upload.name } });
    for (let i = 0; i < uploadsInfo.length; ++i) {
        let info = uploadsInfo[i];
        let result = await uploadFilePut(files[i], info.uploadUrl, (percentComplete) => {
            d.uploadProgress[i].percent = parseFloat(percentComplete.toFixed(2));
        });
        if(result.error) {
            showAlert(`Error with upload ${i+1} ${info.upload.name.slice(0,25)} ` + result.error.toString());
            return;
        }
        d.uploadProgress[i].percent = 100;
    }
    d.uploadProgress = [];
    d.page = 1;
    d.uploads = [];
    getItems();
}

async function saveUpload(upload: Upload) {
    await serverMethods.upload.updateUpload(upload);
}

async function deletedClicked(item) {
    if (await showConfirm({ title: "Confirm Delete", content: "Are you sure you want to delete this?"})) {
        let result = await serverMethods.upload.deleteUpload(item.guid);
        if (checkAndShowHttpError(result))
            return;
        getItems();
    }
}

onMounted(() => {
    getItems();
});

function handlePaste(event) {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        console.log(items[i].kind, items[i].type, items[i]);
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file && file.type.startsWith('image/')) {
                // this.handleImageFile(file);
            }
        }
    }
}
</script>
<template>
    <div class="upload-list-page" ref="root">
        <div v-if="d.loading" class="loading">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
        <div v-else class="content" :class="{ hovering: d.hovering }" @dragover="dragOver" @dragleave="dragLeave" @drop="drop">
            <div class="drop-area" @click="showFileSelect">
                Click to Pick Upload or Drag n Drop
            </div>
            <div @paste="handlePaste" contenteditable="true">Or Click Here and Paste</div>
            <div v-if="d.uploadProgress.length" class="upload-files-list">
                <div v-for="uploadFile of d.uploadProgress" class="upload-file-progress">
                    <div class="upload-file-title">{{ uploadFile.name }}</div>
                    <div v-if="uploadFile.percent == null">Waiting</div>
                    <div v-else-if="uploadFile.percent === 100">Done</div>
                    <div v-else>{{ uploadFile.percent }}%</div>
                </div>
            </div>
            <div class="sites">
                <DataTable :items="d.uploads" :headers="[
                    { name: 'Name', value: 'name', link: getUploadLink },
                    { name: 'Object Id', value: 'objectId', editable:true },
                    { name: 'Size', value: 'size', format: formatBytes },
                ]" :saveFunction="saveUpload"  :deleted="deletedClicked" />
                <DataTablePagination v-if="d.page > 1 || d.uploads.length === d.perPage" v-model:page="d.page" v-model:perPage="d.perPage" @updated="getItems" />
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.upload-list-page {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    .upload-file-title {
        max-width: 200px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin-bottom: 4px;
        font-weight: normal;
    }
    .upload-files-list {
        display: flex;
        overflow-x: auto;
    }
    .upload-file-progress {
        padding: 7px;
        box-shadow: 0 0 3px gray;
        border: 2px solid silver;
        border-radius: 3px;
        margin: 4px;
        flex-shrink: 0;
        text-align: center;
        font-weight: bold;
    }
    .drop-area {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 10px;
        margin-top: 10px;
        // height: 100px;
        // background: gainsboro;
        &:hover {
            text-decoration: underline;
            cursor: pointer;
        }
    }
    .content {
        display: flex;
        flex-direction: column;
        position: relative;
        flex-grow: 1;
        &.hovering {
            opacity: .5;
            // .drop-zone {
            //     position: absolute;
            //     top: 0;
            //     bottom: 0;
            //     left: 0; 
            //     right: 0;
            //     display: flex;
            //     flex-direction: column;
            //     align-items: center;
            //     justify-content: center;
            //     background-color: white;
            //     opacity: .5;
            //     font-size: 25;
            // }
        }
    }
    .loading {
        display: flex;
        justify-content: center;
        padding: 50px;
    }
    .buttons-row {
        display: flex;
        justify-content: flex-end;
        padding: 10px;
    }
    .sites {
        padding: 10px;
        display: flex;
        flex-direction: column;
    }
}
</style>
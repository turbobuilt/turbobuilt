<script lang="ts" setup>
import { reactive, watch } from 'vue';
import FileInput from './FileInput.vue';
import { file } from '@babel/types';
import resize from '@jsquash/resize';
import { serverMethods } from '@/lib/serverMethods';
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { uploadFilePut } from '@/lib/uploadFile';
import { Item } from '@/serverTypes/item/Item.model';
// import { showAlert, showConfirm } from '@/components/ShowModal/showModal';
import getUploadList from '@/serverTypes/upload/getUploadList';
import { Upload } from '@/serverTypes/upload/Upload.model';
import { getUploadLink } from '@/lib/getUploadLink';

const props = defineProps<{
    item: Item;
    maxWidth: number;
    maxHeight: number;
}>()

const d = reactive({
    files: [] as File[],
    resizing: false,
    uploadProgress: [] as { percent: number }[],
    preparingUpload: false,
    uploads: [] as Upload[],
    loading: false
});

const emit = defineEmits(["save"])

async function getImageData(file: File) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    let img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(resolve => img.onload = resolve);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}

async function resizeImages(files: File[]) {
    let resizedFiles: File[] = [];
    for (let file of files) {
        let data = await getImageData(file);
        let resized = await resize(data, { width: props.maxWidth, height: props.maxHeight });
        let canvas = document.createElement("canvas");
        canvas.width = resized.width;
        canvas.height = resized.height;
        let ctx = canvas.getContext("2d");
        ctx.putImageData(resized, 0, 0);
        let blob = await new Promise<Blob>(resolve => canvas.toBlob(resolve));
        let newFile = new File([blob], file.name, { type: file.type });
        resizedFiles.push(newFile);
    }
    return resizedFiles;
}

async function filesChanged(files: File[]) {
    d.resizing = true;
    try {
        d.files = await resizeImages(files);
    } finally {
        d.resizing = false;
    }
    d.resizing = false;
    uploadFiles(d.files);
}

async function uploadFiles(files: File[]) {
    d.uploadProgress = [];
    d.preparingUpload = true;
    let result = await serverMethods.upload.getUploadSignedPutUrlList(files.map(file => {
        return {
            contentType: file.type,
            name: file.name,
            size: file.size
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
        if (result.error) {
            alert(`Error with upload ${i + 1} ${info.upload.name.slice(0, 25)} ` + result.error.toString());
            return;
        }
        d.uploadProgress[i].percent = 100;
    }
    props.item.uploads.push(...result.data.map(uploadData => ({
        upload: uploadData.upload.guid,
        cloudStorageName: uploadData.upload.cloudStorageName
    })));
    emit("save")
    getUploads();
    d.uploadProgress = [];
}

watch(() => props.item, async (newVal, oldVal) => {
    if (newVal) {
        props.item.uploads = props.item.uploads || [];
        getUploads();
    } else {
        d.uploads = [];
    }
}, { immediate: true });

async function getUploads() {
    d.loading = true;
    let result = await serverMethods.upload.getUploadsForDisplay(props.item.uploads.map(item => item.upload));
    d.loading = false;
    if (checkAndShowHttpError(result))
        return;
    d.uploads = result.data.items;
}

async function removeImage(upload: Upload) {
    if (await confirm(JSON.stringify({ title: "Remove Upload?", content: "It will be deleted permanently" }))) {
        console.log("Deleteing", upload)
        await serverMethods.upload.deleteUpload(upload.guid);
        props.item.uploads = props.item.uploads.filter(item => item.upload !== upload.guid);
        emit('save');
        d.uploads = d.uploads.filter(item => item.guid !== upload.guid);
    }
}

</script>
<template>
    <div class="upload-images-component">
        <FileInput @update:model-value="filesChanged" label="Click or Drop Images Here" accept="image/*" :loading="d.resizing" />
        <div v-if="d.uploadProgress.length">
            <div v-for="(progress, index) of d.uploadProgress" class="progress-item" :class="{ 'in-progress': progress }">
                <div>{{ index + 1 }}</div>
                <div v-if="progress.percent === 100">Done</div>
                <div v-else>{{ progress.percent ? progress.percent + "%" : "Waiting" }}</div>
            </div>
        </div>
        <div v-if="props.item && d.uploads">
            <!-- <div>Images</div> -->
            <div v-for="upload of d.uploads" class="uploads-list">
                <div class="upload-container">
                    <img :src="getUploadLink(upload)" />
                    <div class="delete-button" @click="removeImage(upload)">✖️</div>
                </div>
            </div>
        </div>
        <v-dialog v-model="d.resizing" max-width="600">
            <v-card>
                <v-card-text style="padding: 15px;">Resizing</v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>
<style lang="scss">
@use "sass:math";

.upload-images-component {
    .progress-item {}
    .uploads-list {
        height: 150px;
        display: flex;
        overflow-x: auto;
        >* {
            margin: 10px;
        }
    }
    .upload-container {
        position: relative;
        .delete-button {
            $size: 20px;
            position: absolute;
            z-index: 10;
            display: flex;
            justify-content: center;
            align-items: center;
            top: -1*math.div($size,2);
            right: -1*math.div($size,2);
            background: white;
            border-radius: math.div($size,2);
            height: $size;
            width: $size;
            cursor: pointer;
            box-shadow: 0 0 5px rgba(0,0,0,.5);
            transition: .1s all;
            &:hover {
                background: gainsboro;
            }
        }
    }
}
</style>
<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import FileInput from 'FileInput.vue';
import tools from "@turbobuilt/tools";

const props = defineProps<{
    modelValue: any;
    maxWidth?: number;
    maxHeight?: number;
}>()

const emit = defineEmits(["update:modelValue", "save"]);

const d = reactive({
    files: [] as File[],
    resizing: false,
    uploadProgress: [] as { percent: number }[],
    preparingUpload: false,
    uploads: [] as any[],
    loading: false,
    draggingIndex: null as null | number,
    draggedPos: { x: 0, y: 0 },
    currentDraggedOverIndex: null,
    currentDraggedItemWidth: 0,
});

async function getImageData(file: File) {
    if (file.name.match(/\.heic$/i)) {
        // const heic2any = await import("https://cdn.skypack.dev/heic2any");
        const libheif = await import('https://cdn.jsdelivr.net/npm/libheif-js@1.17.1/libheif-wasm/libheif-bundle.mjs');
        const decoder = new (libheif.default()).HeifDecoder();
        const data = decoder.decode(await file.arrayBuffer());
        const image = data[0];
        const width = image.get_width();
        const height = image.get_height();
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        const imageData = ctx.createImageData(width, height);
        await new Promise((resolve, reject) => {
            image.display(imageData, (displayData) => {
                if (!displayData) {
                    return reject(new Error('HEIF processing error'));
                }
                resolve(displayData);
            });
        });
        ctx.putImageData(imageData, 0, 0);
        return ctx.getImageData(0, 0, width, height);
    }
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d")!;
    let img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(resolve => (img.onload = resolve));
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}

function getDimensions(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number) {
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    return { width: originalWidth * ratio, height: originalHeight * ratio };
}

async function resizeImages(files: File[]) {
    let resizedFiles: File[] = [];
    for (let file of files) {
        let data = await getImageData(file);
        let dimensions = getDimensions(data.width, data.height, props.maxWidth || 1080, props.maxHeight || 1080);
        const resizer = await import('https://cdn.jsdelivr.net/npm/@jsquash/resize@2.1.0/index.min.js');
        let resized = await resizer.default(data, dimensions);
        let blob = await convertImageToWebP(resized);
        let newFile = new File([blob], file.name.replace(/\.[^\.]{3,4}$/g, ".webp"), { type: blob.type });
        resizedFiles.push(newFile);
    }
    return resizedFiles;
}

async function convertImageToWebP(imageData: ImageData) {
    const webp = await import("https://unpkg.com/@jsquash/webp@1.2.0?module");
    const webpBuffer = await webp.encode(imageData, { quality: 75 });
    return new Blob([webpBuffer], { type: 'image/webp' });
}

async function filesChanged(files: File[]) {
    d.resizing = true;
    try {
        d.files = await resizeImages(files);
    } finally {
        d.resizing = false;
    }
    uploadFiles(d.files);
}

async function getImageSize(file: File) {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

async function uploadFiles(files: File[]) {
    d.uploadProgress = [];
    d.preparingUpload = true;
    let result = await tools.util.callMethod(
        "upload.getUploadSignedPutUrlList",
        [await Promise.all(files.map(async file => {
            let dimensions = await getImageSize(file);
            return {
                contentType: file.type,
                name: file.name,
                size: file.size,
                metadata: { width: dimensions.width, height: dimensions.height }
            };
        }))]
    );
    d.preparingUpload = false;
    if (result.error) {
        alert(result.error);
        return;
    }
    let uploadsInfo = result.data;
    d.uploadProgress = result.data.map(item => ({ percent: 0, name: item.upload.name }));
    for (let i = 0; i < uploadsInfo.length; ++i) {
        let info = uploadsInfo[i];
        let res = await tools.upload.uploadFilePut(files[i], info.uploadUrl, percent => {
            d.uploadProgress[i].percent = parseFloat(percent.toFixed(2));
        });
        if (res.error) {
            alert(`Error with upload ${(i + 1)} ${info.upload.name.slice(0, 25)} ${res.error.toString()}`);
            return;
        }
        d.uploadProgress[i].percent = 100;
    }
    props.modelValue.push(...result.data.map(uploadData => ({
        upload: uploadData.upload.guid,
        cloudStorageName: uploadData.upload.cloudStorageName
    })));
    emit("save");
    d.uploadProgress = [];
    getUploads();
}

watch(() => props.modelValue, async (newVal) => {
    if (newVal) {
        getUploads();
    } else {
        emit("update:modelValue", reactive([]));
        d.uploads = [];
    }
}, { immediate: true });

async function getUploads() {
    d.loading = true;
    let result = await tools.util.callMethod("upload.getUploadsForDisplay", [props.modelValue.map(item => item.upload)]);
    d.loading = false;
    if (result.error) {
        alert(result.error);
        return;
    }
    result.data.items.sort((a, b) => props.modelValue.findIndex(item => item.upload === a.guid) - props.modelValue.findIndex(item => item.upload === b.guid));
    d.uploads = result.data.items
}

async function removeImage(upload: any) {
    if (await confirm(JSON.stringify({ title: "Remove Upload?", content: "It will be deleted permanently" }))) {
        await tools.util.callMethod("upload.deleteUpload", [upload.guid]);
        emit("update:modelValue", props.modelValue.filter((item: any) => item.upload !== upload.guid));
        emit('save');
        d.uploads = d.uploads.filter((item: any) => item.guid !== upload.guid);
    }
}

const uploadsList = ref<HTMLDivElement | null>(null);
// for drag, if they start on an image and go left or right, it will swap the image with the one on the left or right immediately.
var startX = 0, startY = 0;
var lastX = 0, lastY = 0;
var mouseOffsetOnDraggedX = 0;
var boxes = [];
function startDrag(event, upload, index) {
    if (event.button !== 0)
        return;
    // make boxes the bounding client rects of all items
    boxes = Array.from(uploadsList.value.querySelectorAll(".upload-container")).map(item => item.getBoundingClientRect());
    d.draggingIndex = index;
    d.currentDraggedItemWidth = event.target.offsetWidth;
    d.draggedPos = { x: 0, y: 0 };
    startX = event.clientX;
    startY = event.clientY;
    lastX = event.clientX;
    lastY = event.clientY;
    mouseOffsetOnDraggedX = event.clientX - event.target.getBoundingClientRect().left;
    d.currentDraggedOverIndex = index;
    d.currentDraggedItemWidth = event.target.offsetWidth;
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", endDrag);
}
function drag(event: MouseEvent) {
    // if moved left , and mouse is over the 
    let x = event.clientX - startX;
    d.draggedPos = { x: x, y: startY };
    // loop over all the images and see if the dragged image is over any of them
    for (let i = 0; i < boxes.length; ++i) {
        let rect = boxes[i];
        if (event.clientX - mouseOffsetOnDraggedX > rect.left && event.clientX - mouseOffsetOnDraggedX < rect.right) {
            d.currentDraggedOverIndex = i;
            break;
        }
    }
}
function endDrag(event) {
    // rearrange the items
    if (d.currentDraggedOverIndex !== null) {
        let current = props.modelValue.splice(d.draggingIndex, 1)[0];
        props.modelValue.splice(d.currentDraggedOverIndex, 0, current);
        console.log("spliced", d.draggingIndex, d.currentDraggedOverIndex);

        let currentUpload = d.uploads.splice(d.draggingIndex, 1)[0];
        d.uploads.splice(d.currentDraggedOverIndex, 0, currentUpload);
    }
    d.draggingIndex = null;
    d.draggedPos = { x: 0, y: 0 };
    d.currentDraggedItemWidth = 0;
    d.currentDraggedOverIndex = null;
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", endDrag);
}

function getTransform(index) {
    if (d.draggingIndex === index)
        return 'translateX(' + (d.draggedPos.x) + 'px)'
    if (index < d.draggingIndex) {
        if (d.currentDraggedOverIndex <= index)
            return 'translateX(' + d.currentDraggedItemWidth + 'px)'
    } else if (index >= d.draggingIndex) {
        if (d.currentDraggedOverIndex >= index)
            return 'translateX(' + -d.currentDraggedItemWidth + 'px)'
    }
}
</script>

<template>
    <div class="upload-images-component">
        <FileInput v-if="!d.uploadProgress?.length" @update:model-value="filesChanged" label="Click or Drop Images Here"
            accept="image/*" :loading="d.resizing" />
        <div v-if="d.uploadProgress.length">
            <div v-for="(progress, index) of d.uploadProgress" :key="index" class="progress-item"
                :class="{ 'in-progress': progress }">
                <div v-if="d.uploadProgress.length > 1">Processing number {{ index + 1 }}</div>
                <div v-if="progress.percent === 100">Done</div>
                <div v-else>{{ progress.percent ? progress.percent + "%" : "Waiting" }}</div>
            </div>
        </div>
        <div v-if="props.modelValue && d.uploads" class="uploads-list" ref="uploadsList">
            <div v-for="(upload, index) of d.uploads" :key="upload.guid">
                <div class="upload-container" :style="{
                    'transform': getTransform(index),
                    'transition': d.draggingIndex === index ? 'none' : 'transform .1s',
                    'z-index': d.draggingIndex === index ? 100 : 1
                }" @mousedown="startDrag($event, upload, index)" @dragstart.prevent>
                    <img :src="tools.upload.getUploadUrl(upload)" />
                    <div class="delete-button" @click="removeImage(upload)">✖️</div>
                </div>
            </div>
        </div>
        <div v-show="d.resizing" class="resizing-notice-bg">
            <div style="padding: 15px;">Resizing</div>
        </div>
    </div>
</template>

<style lang="scss">
@use "sass:math";

.upload-images-component {
    .dragged-over {
        margin-left: 50px;
    }

    .progress-item {
        padding: 10px;
        text-align: center;
        width: 100px;
    }

    .resizing-notice-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, .1);
        display: flex;
        justify-content: center;
        align-items: center;

        >div {
            padding: 10px;
            background: white;
        }
    }

    .uploads-list {
        margin-top: 10px;
        height: 150px;
        display: flex;
        overflow-x: auto;
        box-shadow: inset -2px 0 3px gray;

        >* {
            margin: 10px;
        }
    }

    .upload-container {
        position: relative;
        height: 100%;

        >img {
            height: 100%;
        }

        .delete-button {
            $size: 20px;
            position: absolute;
            z-index: 10;
            display: flex;
            justify-content: center;
            align-items: center;
            top: -1 * math.div($size, 2);
            right: -1 * math.div($size, 2);
            background: white;
            border-radius: -1 * math.div($size, 2);
            height: $size;
            width: $size;
            cursor: pointer;
            box-shadow: 0 0 5px rgba(0, 0, 0, .5);
            transition: .1s all;

            &:hover {
                background: gainsboro;
            }
        }
    }
}
</style>
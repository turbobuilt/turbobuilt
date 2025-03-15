<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{
    label: string;
    accept?: string;
    loading?: boolean;
}>()
const emit = defineEmits(["update:modelValue"]);

const root = ref(null);
let fileInput = null;

function onFileChange(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files);
    if (files.length > 0) {
        emit("update:modelValue", files);
    }
    destroyFileInput();
    createFileInput();
}

function createFileInput() {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    fileInput.accept = props.accept;
    fileInput.addEventListener("change", onFileChange);
    root.value.appendChild(fileInput);
}

function destroyFileInput() {
    if (fileInput) {
        fileInput.removeEventListener("change", onFileChange);
        fileInput.remove();
        fileInput = null;
    }
}

onMounted(() => {
    createFileInput();
})

onUnmounted(() => {
    destroyFileInput();
})

function dragOver(e: DragEvent) {
    e.preventDefault();
    root.value.classList.add("drag-over");
}

function dragLeave(e: DragEvent) {
    e.preventDefault();
    root.value.classList.remove("drag-over");
}

function drop(e: DragEvent) {
    e.preventDefault();
    root.value.classList.remove("drag-over");
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        emit("update:modelValue", files);
    }
}
</script>
<template>
    <div class="file-input" ref="root" @click="fileInput.click()" @dragover="dragOver" @dragleave="dragLeave"
        @drop="drop">
        <div v-if="!loading">{{ label }}</div>
        <div v-else>
            <!-- <v-progress-circular indeterminate :size="18" /> -->
            Uploading
        </div>
    </div>
</template>
<style lang="scss">
.file-input {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 50px;
    min-width: 200px;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    background-color: #f9f9f9;
    color: #666;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.1s;

    &.drag-over {
        background-color: #f0f0f0;
    }
}
</style>
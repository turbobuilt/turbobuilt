<script lang="ts" setup>
import { defineProps, defineEmits, onMounted, onBeforeUnmount, ref, reactive } from 'vue';

const props = defineProps(["block", "index"]);
const emit = defineEmits(["resize"]);

const d = reactive({
    iframeHeight: 0
});

const el = ref<HTMLDivElement|null>(null);
let intervalId: number|null = null;

onMounted(() => {
    const iframe = el.value?.querySelector('iframe');
    if (!iframe) return;
    
    // Check size periodically and update
    intervalId = window.setInterval(() => {
        const doc = (iframe as HTMLIFrameElement).contentDocument;
        if (!doc) return;
        const newHeight = doc.documentElement.scrollHeight;
        if (newHeight && newHeight !== props.block.height) {
            props.block.height = newHeight;
            emit("resize", { index: props.index, height: newHeight });
        }
    }, 1000);
});

onBeforeUnmount(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }
});
</script>

<template>
    <div ref="el" :style="{ height: props.block.height + 'px' }">
        <iframe
            :src="`/component-preview/${props.block.component.workspace}${props.block.component.path}`"
            style="width: 100%; border: none;" :style="{ height: props.block.height + 'px' }"
        ></iframe>
    </div>
</template>

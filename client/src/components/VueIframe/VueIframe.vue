<script setup>
import { onMounted, ref, useSlots, createApp } from 'vue';
const props = defineProps(["data", "frame", "element"]);
const emit = defineEmits(["update:frame"]);
const mainIframe = ref(null);

onMounted(() => {
    let el = null;
    if (!props.element) {
        const body = mainIframe.value.contentDocument.body;
        const iframeDoc = mainIframe.value.contentDocument;
        let viewportMeta = iframeDoc.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = iframeDoc.createElement('meta');
            viewportMeta.setAttribute('name', 'viewport');
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1');
            iframeDoc.head.appendChild(viewportMeta);
        }

        // add style clearing margin and padding
        body.style.margin = '0';
        body.style.padding = '0';
        el = document.createElement('div');
        body.appendChild(el);
    } else {
        el = props.element;
    }
    const slots = useSlots();
    const iApp = createApp({
        render() {
            return slots.default();
        }
    });
    iApp.mount(el);
    emit('update:frame', mainIframe.value);
});
</script>
<template>
    <iframe ref="mainIframe" class="vue-iframe"></iframe>
</template>
<style lang="scss">
.vue-iframe {
    width: 100%;
    height: 100%;
    border: none;
}
</style>
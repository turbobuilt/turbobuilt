<script setup lang="ts">
import { mdiFormatBold, mdiFormatItalic, mdiFormatUnderline, 
    mdiFormatListBulleted, mdiFormatListNumbered
 } from '@mdi/js';
import { computed, onBeforeMount, onBeforeUnmount, onMounted, reactive, Ref } from 'vue';

const props = defineProps<{
    command: 'bold'|'italic'|'underline'|'insertUnorderedList'|'insertOrderedList';
    editor: HTMLDivElement | null;
}>();

const emit = defineEmits(["activated"]);
 
const d = reactive({
    active: false
});

const icon = computed(() => {
    switch (props.command) {
        case 'bold':
            return mdiFormatBold;
        case 'italic':
            return mdiFormatItalic;
        case 'underline':
            return mdiFormatUnderline;
        case 'insertUnorderedList':
            return mdiFormatListBulleted;
        case 'insertOrderedList':
            return mdiFormatListNumbered;
    }
})

function buttonClicked(event) {
    event.preventDefault();
    event.stopPropagation();
    document.execCommand(props.command, false);
    checkState();
}

function checkState() {
    d.active = document.queryCommandState(props.command);
}
var unmounted = false;
onBeforeUnmount(() => {
    unmounted = true;
    props.editor.removeEventListener('keyup', checkState);
    props.editor.removeEventListener('click', checkState);
});

onMounted(async () => {
    while(!props.editor) {
        if (unmounted) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    checkState();
    props.editor.addEventListener('keyup', checkState);
    props.editor.addEventListener('click', checkState);
});
</script>
<template>
    <button @mousedown="buttonClicked" :class="{ 'active': d.active }">
        <svg style="width:24px;height:24px" viewBox="0 0 24 24" >
            <path :d="icon" />
        </svg>
    </button>
</template>
<style scoped lang="scss">
</style>

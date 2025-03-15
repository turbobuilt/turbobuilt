<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
const props = defineProps<{
    modelValue: string;
}>();
const emit = defineEmits(["update:modelValue"]);

const textareaRef = ref<HTMLTextAreaElement | null>(null);
function autoGrow() {
    console.log("GROWING")
    if (!textareaRef.value) return;
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px';
}

function inputted() {
    emit('update:modelValue', textareaRef.value?.value);
    autoGrow();
}

watch(() => props.modelValue, autoGrow);
onMounted(autoGrow);
</script>

<template>
    <textarea ref="textareaRef" :modelValue="props.modelValue" @input="inputted" style="width: 100%; overflow: hidden; padding: 5px;" ></textarea>
</template>

<style lang="scss">
.bob {
    color: green;
}
</style>
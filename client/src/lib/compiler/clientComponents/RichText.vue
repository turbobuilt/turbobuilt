<script setup lang="ts">
import { ref, watch, onMounted, reactive } from 'vue';
import RichTextButton from 'RichTextButton.vue';
const props = defineProps<{
    modelValue: string;
    placeholder?: string;
}>();
const emit = defineEmits(["update:modelValue"]);
const d = reactive({
    textArea: null as HTMLDivElement | null,
});

const textareaRef = ref<HTMLDivElement | null>(null);

function inputted() {
    emit('update:modelValue', textareaRef.value?.innerHTML);
}

onMounted(() => {
    console.log("mounted rich text");
    d.textArea = textareaRef.value;
    watch(() => props.modelValue, () => {
        // if props.modelValue != textareaRef.value.innerText, update the contenteditable
        console.log("props.modelVlaue", props.modelValue, "value", textareaRef.value?.innerHTML, props.modelValue == textareaRef.value?.innerHTML);
        if (props.modelValue != textareaRef.value?.innerHTML) {
            console.log("NOT EQUAL");
            textareaRef.value.innerHTML = props.modelValue;
        }
    }, { immediate: true });
});
</script>
<template>
    <div class="turbobuilt-rich-text-input">
        <div class="buttons-menu">
            <RichTextButton command="bold" :editor="d.textArea"/>
            <RichTextButton command="italic" :editor="d.textArea"/>
            <RichTextButton command="underline" :editor="d.textArea"/>
            <RichTextButton command="insertUnorderedList" :editor="d.textArea"/>
            <RichTextButton command="insertOrderedList" :editor="d.textArea"/>
        </div>
        <div
            ref="textareaRef"
            contenteditable="true"
            @input="inputted"
            style="border: 1px solid #ccc; padding: 5px; min-height: 100px; margin-top: 5px;"
            :placeholder="props.placeholder"
        ></div>
    </div>
</template>
<style scoped lang="scss">
.turbobuilt-rich-text-input {
    .buttons-menu {
        display: flex;
        margin-bottom: 5px;
        button {
            display: flex;
            border-radius: 3px;
            align-items: center;
        }
        .active {
            background: black;
            svg {
                stroke: white;
                fill: white;
            }
        }
    }
}
</style>

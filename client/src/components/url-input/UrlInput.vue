<script lang="ts" setup>
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import ResizingTextInput from './components/ResizingTextInput.vue';

const props = defineProps<{
    modelValue: any;
    label?: string;
    readonly?: boolean
}>();

const root = ref(null);

const emit = defineEmits(["update:modelValue"])

async function reset() {
    emit("update:modelValue", [{
        type: "text",
        value: ""
    }]);
}

watch(() => props.modelValue, newVal => !newVal && reset(), { immediate: true });

function addSection(type) {
    props.modelValue.push({
        type,
        value: ""
    })
    console.log(Array.from(root.value.querySelectorAll("input")).at(-1));
    nextTick(() => root.value.querySelector(`.input-${props.modelValue.length - 1}`).focus())
}

function keyDown(part, event) {
    if ((event.key === "/" || event.key === "Enter") && part.value) {
        event.preventDefault();
        event.target.blur();
        setTimeout(() => {
            addSection("text");
        }, 50);
    }
}

function keyPressed(part, event) {
    const regex = /[^a-zA-Z0-9\-._~!$&'()*+,;=:@]/;
    if (regex.test(event.target.value)) {
        event.preventDefault();
    }
}

function switchToVariable(part, index) {
    part.type = 'variable'
    nextTick(() => {
        root.value.querySelector(`.select-${index}`).focus();
    })
}

function selectEnterPressed(part) {
    if (part.value === "convert_to_text") {
        part.type = "text";
    }
}

function variableValueChanged(event, part, index) {
    if (event.target.value === "convert_to_text") {
        part.type = "text";
        part.value = "";
        nextTick(() => {
            setTimeout(() => {
                console.log(root.value.querySelector(`.input-${index}`))
                root.value.querySelector(`.input-${index}`).focus()
            }, 500)
        })
        return;
    }
    part.value = event.target.value;
}

let options = [
    { value: "", label: "" },
    { value: "websitePage.identifier", label: "Page Identifier" },
    { value: "item.guid", label: "Item Identifier" },
    // { value: "convert_to_text", label: "Convert To Plain Text"}
]

</script>
<template>
    <div class="url-input" ref="root">
        <div class="label" v-if="props.label">{{ props.label }}</div>
        <div class="url-input-content" v-if="props.modelValue">
            <template v-if="!props.readonly" v-for="(part, index) of props.modelValue">
                <div>/</div>
                <ResizingTextInput v-if="part.type === 'text'" v-model="part.value" @keydown="event => keyDown(part, event)" :class="`input-${index}`" @keypress="event => keyPressed(part, event)" @switchToVariable="switchToVariable(part, index)" />
                <div v-else-if="part.type === 'variable'">
                    <select :value="part.value" @change="event => variableValueChanged(event, part, index)" :class="`select-${index} input-${index}`">
                        <option v-for="option of options" :value="option.value">{{ option.label }}</option>
                    </select>
                </div>
            </template>
            <template v-if="!props.readonly">
                <button @click="props.modelValue.pop()" v-if="props.modelValue.length > 1">Delete Last</button>
                <button @click="addSection('text')">Add Text Section</button>
                <button @click="addSection('variable')">Add Variable Section</button>
            </template>
            <template v-else>
                <template v-for="part of props.modelValue">
                    <div>/</div>
                    <div v-if="part.type === 'text'">{{ part.value }}</div>
                    <div v-if="part.type === 'variable'">{{ "{ " + options.find(option => option.value === part.value)?.label + " }" }}</div>
                </template>
            </template>
        </div>
    </div>
</template>
<style lang="scss">
@import "@/scss/variables.module.scss";
.url-input {
    padding: 4px 15px;
    background: whitesmoke;
    border-bottom: 1px solid rgb(168, 168, 168);
    .url-input-content {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
    }
    .label {
        font-size: 13px;
        opacity: .8;
        margin-bottom: 4px;
    }
    input, select {
        height: 25px;
        padding: 0 2px;
        margin: 0 3px;
        border: 1px solid gray;
        line-height: 1;
        min-width: 25px;
        border-radius: 2px;
        &:active, &:focus, &:focus-visible {
            outline: none;
            border: 1px blue solid;
        }
    }
    button {
        background: $primary;
        color: white;
        padding: 5px;
        line-height: 1;
        margin: 2px;
        border-radius: 3px;
    }
}
</style>
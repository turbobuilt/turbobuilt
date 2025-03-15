<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from "vue"
import Dropdown from "./Dropdown.vue";

const props = defineProps<{
    modelValue: string
}>();
const emit = defineEmits(["update:modelValue","switchToVariable"])

const inputElement = ref(null);

const d = reactive({
    focused: false,
    keyPressHandler: null
})

onMounted(() => {
    watch(() => props.modelValue, (newVal, oldVal) => {
        if (inputElement.value) {
            inputElement.value.style.width = '25px'; // Reset width to auto to recalculate
            inputElement.value.style.width = `${inputElement.value.scrollWidth + 10}px`;
        }
    }, { immediate: true })
})

function update(event) {
    emit('update:modelValue', event.target.value)
}

function setKeyPressHandler(handler) {
    d.keyPressHandler = handler
}

function onKeyPress(event) {
    // let result = d.keyPressHandler(event);
    // if (result?.selected !== undefined) {
    //     if (result.selected === 0) {
    //         console.log("EMMM")
    //         emit("switchToVariable", true)
    //     }
    // }
}

</script>
<template>
    <div style="position: relative;">
        <input :value="modelValue" @input="update" class="resizing-text-input" ref="inputElement" @focus="d.focused = true" @blur="d.focused = false" @keydown="onKeyPress" />
        <!-- <Dropdown :show="d.focused" @keyPressHandler="setKeyPressHandler" /> -->
    </div>
</template>
<style lang="scss">
.resizing-text-input {
    width: 0;
    min-width: 25px;
}
</style>
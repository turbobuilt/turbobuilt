<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  floating: { type: Boolean, default: true },
  error: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  label: { type: String, default: 'Label' },
});

const inputValue = ref('');
const isFocused = ref(false);

function onFocus() {
  isFocused.value = true;
}

function onBlur() {
  if (!inputValue.value) {
    isFocused.value = false;
  }
}
</script>
<template>
  <div class="floating-input" :class="{ error }">
    <label v-if="floating" :class="{ active: inputValue || isFocused }">{{ label }}</label>
    <input
      :type="type"
      v-model="inputValue"
      @focus="onFocus"
      @blur="onBlur"
    />
  </div>
</template>
<style lang="scss" scoped>
.floating-input {
  border: 1px solid #ccc;
  border-radius: 3px;
  position: relative;
  padding: 0.5rem;

  &.error {
    border-color: #e66;
  }

  label {
    position: absolute;
    top: 50%;
    left: 0.5rem;
    transform: translateY(-50%);
    transition: 0.2s;
    pointer-events: none;
    &.active {
      top: 4px;
      transform: none;
      font-size: 0.55rem;
    }
  }

  input {
    width: 100%;
    border: none;
    outline: none;
    padding: 0;
    padding-top: 9px;
  }
}
</style>
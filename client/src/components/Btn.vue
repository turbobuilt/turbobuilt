<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    inheritAttrs: false,
    computed: {
        attrs() {
            return {
                ...this.$attrs,
                color: this.$attrs.color
            }
        }
    }
})

</script>
<template>
    <!-- <v-btn v-bind="attrs" class="btn">
        <slot></slot>
    </v-btn> -->
</template>
<style lang="scss">
@import "../scss/variables.module.scss";
.btn.v-btn {
    // background-color: $darkBg;
    border: 2px solid $primary;
    color: white;
    width: 100%;
    border: 2px solid $primary;
    &.v-btn--variant-text {
        background-color: transparent;
        color: black;
        border: none;
    }
    &.text-only {
        background-color: transparent;
        color: black;
        border: none;
        box-shadow: none;
    }
    // &.bg-primary {
    //     background-color: rgb(77, 77, 77);
    // }
}
</style>
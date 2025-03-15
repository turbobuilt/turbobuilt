<script lang="ts">
import Vue, { createApp, defineComponent } from 'vue';
import axios from "axios";
import { title } from 'process';

export default defineComponent({
    props: ["onClose","title", "component","props","closable"],
    data() {
        return {
            showing: true
        }
    },
    mounted() {

    },
    computed: {

    },
    methods: {
        showingUpdated(val) {
            this.onClose();
        },
        close(val) {
            this.showing = false;
            this.onClose(val);
        }
    }
})

</script>
<template>
    <div class="show-modal">
        <v-dialog max-width="500" @update:modelValue="showingUpdated" v-model="showing" :persistent="!closable">
            <component :is="component" v-bind="props" @close="close"></component>
        </v-dialog>
    </div>
</template>
<style lang="scss">
.modal-content {
    padding: 20px;
    background-color: white;
    border-radius:20px;
    box-shadow: 0 0 15px rgba(0,0,0,0.7);
    .title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 20px;
    }
    .content {
        font-size: 16px;
    }
}
</style>
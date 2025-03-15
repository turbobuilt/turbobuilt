<script lang="ts">
import Vue, { defineComponent } from 'vue';
import axios from "axios";

export default defineComponent({
    props: ["title", "content","close", "label"],
    data() {
        return {
            value: ""
        }
    },
    mounted() {

    },
    computed: {

    },
    methods: {

    }
})
</script>
<template>
    <div class="modal-content confirm-dialog">
        <div class="title" v-if="title">{{ title }}</div>
        <div class="content">
            {{ content }}
            <v-text-field v-model="value" :label="label||''" outlined></v-text-field>
        </div>
        <div class="buttons">
            <btn :ripple="false" @click="$emit('close', false)" class="text-only">Cancel</btn>
            <btn :ripple="false" @click="$emit('close', label)">Submit</btn>
        </div>
    </div>
</template>
<style lang="scss">
.confirm-dialog {
    .buttons {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        .btn.v-btn {
            width: auto;
        }
    }
}
</style>
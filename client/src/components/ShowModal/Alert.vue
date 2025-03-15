<script lang="ts">
import Vue, { defineComponent } from 'vue';
import axios from "axios";

export default defineComponent({
    props: ["title", "content","close"],
    data() {
        return {
            search: ""
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
    <div class="modal-content alert-dialog">
        <div class="title" v-if="title">{{ title }}</div>
        <div class="content" v-html="content">
        </div>
        <div class="buttons">
            <btn variant="plain" :ripple="false" @click="$emit('close')">OK</btn>
        </div>
    </div>
</template>
<style lang="scss">
.alert-dialog {
    p {
        margin-bottom: 5px;
    }
    .buttons {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
    }
}
</style>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    props: ["title", "content","close", "confirmText"],
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
        </div>
        <div class="buttons">
            <v-btn :ripple="false" @click="$emit('close', false)" class="text-only">Cancel</v-btn>
            <v-btn :ripple="false" @click="$emit('close', true)">{{ confirmText || 'Yes' }}</v-btn>
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
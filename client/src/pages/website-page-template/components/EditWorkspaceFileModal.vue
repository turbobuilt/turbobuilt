<script lang="ts" setup>
import { reactive } from "vue"

const props = defineProps<{
    modelValue: any,
    workspaceFile: any
}>()
const emit = defineEmits(["update:modelValue"])

const d = reactive({

});

</script>
<template>
    <v-dialog :model-value="props.modelValue" @update:model-value="value => emit('update:modelValue', value)" class="edit-component-modal">
        <v-card>
            <WorkspaceEditor :workspace-file="props.workspaceFile" style="min-width: 100vw;min-height: 100vh;" @close="emit('update:modelValue', false)" />
        </v-card>
    </v-dialog>
</template>
<style lang="scss">
.edit-workspace-file-modal {}
</style>
<script lang="ts" setup>
import { defineProps, defineEmits, reactive } from 'vue'
import TreeViewItem from './TreeViewItem.vue'

const props = defineProps(["modelValue", "level", "open", "path"]);
const emit = defineEmits(["update:modelValue", "selected", "name-updated"]);

const d = reactive({
    editingIndex: null
})

function toggleContextMenu(item) {
    console.log('toggleContextMenu', item, props.path + '/' + item.name);
}

</script>
<template>
    <div class="tree-view-item" v-for="(item, index) of props.modelValue " :style="{ marginLeft: (props.level || 0) * 20 + 'px' }" @click.stop="emit('selected', { path: item.name, item })" @contextmenu.prevent.stop="toggleContextMenu(item)">
        <TreeViewItem :item="item" @name-updated="value => emit('name-updated', value)" />
        <TreeView v-if="item.children && item.open" v-model="item.children" :level="(props.level || 0) + 1" @selected="value => emit('selected', { path: item.name + '/' + value.path, item: value.item })" :path="(props.path || '') + '/' + item.name"  @name-updated="value => emit('name-updated', value)"/>
    </div>
</template>
<style lang="scss">
.tree-view-item {
    .tree-view-item__label {
        user-select: none;
        cursor: pointer;
    }
}
</style>
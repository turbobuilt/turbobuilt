<script lang="ts" setup>
import { mdiTrashCanOutline } from '@mdi/js';
import { getCurrentInstance } from 'vue';
import { defineProps, defineEmits, reactive, computed, watch, ref, nextTick } from 'vue';
import { useSlots } from 'vue'
const slots = useSlots();

const props = defineProps<{
    headers: { name: string, value: string, type?: "checkbox" | "url", onUpdateModelValue?: Function, editable?: boolean, alwaysEditable?: boolean, format?: Function, link?: Function, enabledSwitch?: string }[];
    items?: any[];
    manySelectable?: boolean;
    saveFunction?: Function;
    deleted?: (item: any) => void
}>()

const emit = defineEmits(['selected']);
const root = ref(null);

const d = reactive({
    selected: new Set(),
    editingItem: null as any,
    saving: false,
    updatingItems: {}
})

function checkToggled(item, value) {
    if (value) {
        d.selected.add(item);
    } else {
        d.selected.delete(item);
    }
}

const allChecked = computed(() => {
    return props.items?.length && d.selected.size === props.items.length;
})

function allCheckToggled() {
    if (allChecked) {
        d.selected.clear();
    } else {
        for (let item of props.items) {
            d.selected.add(item);
        }
    }
}

watch(() => props.items, (newVal, oldVal) => {
    d.selected.clear();
    d.updatingItems = {};
})

var backupData = null;
function toggleEditingCell(event, header, item, index) {
    if (!header.editable || d.editingItem === item)
        return;
    let currentTarget = event.currentTarget;
    d.editingItem = item;
    backupData = JSON.stringify(item);
    nextTick(() => {
        setTimeout(() => currentTarget.querySelector("input").focus(), 0);
    })
}

function cancelEditing() {
    console.log("canceling")
    let index = props.items.indexOf(d.editingItem);
    props.items[index] = JSON.parse(backupData);
    backupData = null;
    d.editingItem = null;
}

async function doSave(item) {
    d.saving = true;
    await props.saveFunction(item);
    d.saving = false;
    d.editingItem = null;
}

async function inputKeyPressed(event, item) {
    if (event.key === 'Enter')
        doSave(item);
    else if (event.key === 'Escape')
        cancelEditing();
}

async function checkboxChanged(header, value, item, index) {
    if (!header.onUpdateModelValue) {
        item[header.value] = value;
        return;
    }
    try {
        d.updatingItems[item] = true;
        await header.onUpdateModelValue(value, item, index)
    } catch (err) {
        console.error("error updating", err)
    } finally {
        d.updatingItems[item] = false;
    }
}

const showDeleted = computed(() => {
    const thisInstance = getCurrentInstance();
    return thisInstance.attrs

    if (thisInstance.attrs.deleted)
        return true;
    return false;
})

</script>
<template>
    <table class="data-table" border-collapse="collapse" ref="root">
        <thead>
            <tr>
                <th v-if="props.manySelectable" class="checkbox-column">
                    <v-checkbox :model-value="allChecked" :indeterminate="!allChecked && d.selected.size > 0" @update:model-value="value => allCheckToggled()" density="compact" hide-details="auto" />
                </th>
                <th v-for="header of headers" :key="header.value">{{ header.name }}</th>
                <th v-if="slots.lastColumn" style="width: 0;"></th>
                <th v-if="showDeleted" style="width: 0;"></th>
                <th v-if="d.editingItem"></th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in items" :key="item.guid" @click="emit('selected', item)">
                <td v-if="props.manySelectable">
                    <v-checkbox :model-value="d.selected.has(item)" @update:model-value="value => checkToggled(item, value)" density="compact" hide-details="auto" />
                </td>
                <component v-for="(header, index) of headers" :key="header.value" @click="event => toggleEditingCell(event, header, item, index)" :class="{ editing: d.editingItem === item, clickable: d.editingItem !== item && header.editable }" :is="header.link ? 'a' : 'td'" :href="header.link ? header.link(item) : ''" target="_blank">
                    <template v-if="header.type === 'checkbox'">
                        <v-checkbox v-if="!d.updatingItems[item] || !header.editable" hide-details="auto" density="compact" :modelValue="!!item[header.value]" @update:model-value="value => checkboxChanged(header, value, item, index)" :disabled="(d.editingItem !== item && !header.alwaysEditable)" />
                        <v-progress-circular indeterminate :size="16" v-else />
                    </template>
                    <div v-else-if="header.type === 'url'" style="display: flex; align-items: center;">
                        <v-checkbox density="compact" hide-details="auto" v-if="header.enabledSwitch" v-model="item[header.enabledSwitch]" label=""/>
                        <UrlInput style="flex-grow: 1" v-if="!header.enabledSwitch || item[header.enabledSwitch]" v-model="item[header.value]" :readonly="!header.editable || d.editingItem !== item" />
                    </div>
                    <template v-else>
                        <template v-if="d.editingItem !== item || !header.editable">
                            <template v-if="header.format">{{ header.format(item[header.value]) }}</template>
                            <template v-else>{{ item[header.value] }}</template>
                        </template>
                        <input v-else class="editing-input" v-model="item[header.value]" @keypress.enter="doSave(item)" @keydown.esc="cancelEditing()" />
                    </template>
                </component>
                <td v-if='slots.lastColumn'>
                    <slot name="lastColumn" :item="item"></slot>
                </td>
                <td v-if='deleted'>
                    <div class="delete-icon">
                        <v-icon :icon="mdiTrashCanOutline" @click="deleted(item)"/>
                    </div>
                </td>
                <td v-if="d.editingItem === item">
                    <v-btn size="small" color="primary" @click="doSave(item)">
                        <div v-if="!d.saving">Save</div>
                        <v-progress-circular indeterminate :size="14" v-else />
                    </v-btn>
                </td>
            </tr>
        </tbody>
    </table>
</template>
<style lang="scss">
.data-table {
    border-collapse: collapse;
    .checkbox-column {
        width: 50px;
    }
    thead {
        background-color: #f0f0f0;
    }
    th, td {
        text-align: left;
        padding: 15px;
        line-height: 1.2;
        // border: 1px solid black;
    }
    td.editing {
        padding: 2px 15px;
    }
    td.clickable {
        cursor: pointer;
        transition: .1s all;
        &:hover {
            background-color: whitesmoke;
        }
    }
    tr {
        border-bottom: 1px solid rgb(172, 172, 172);
    }
    tr > * {
        display: table-cell;
        vertical-align: middle;
    }
    .editing-input {
        border: 1px solid gray;
        width: 100%;
        height: 50px;
        padding: 10px;
    }
}
</style>

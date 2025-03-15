<script lang="ts" setup>
import { ItemProperty } from '@/serverTypes/itemProperty/ItemProperty.model';
import ItemPropertyTypeSelector from './components/ItemPropertyTypeSelector.vue';
import ItemPropertyValueInput from './components/ItemPropertyValueInput.vue';
import { onMounted, reactive, watch } from 'vue';
import { mdiTrashCanOutline } from '@mdi/js';
import { Item } from '@/serverTypes/item/Item.model';
import { serverMethods } from '@/lib/serverMethods';
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { WebsiteProperty } from '@/serverTypes/websiteProperty/WebsiteProperty.model';
import { ItemPropertyInfo } from '../type';


const props = defineProps<{
    itemProperty: ItemPropertyInfo;
    standardProp?: boolean;
    placeholder?: string;
}>()

const emit = defineEmits(["deleteClicked"]);

let debounceTimeout = null;
let lastUpdate = Date.now();
let debounceTime = 4_000;
let saving = false;
onMounted(() => {
    watch(() => props.itemProperty?.value, (newVal) => {
        if (debounceTimeout)
            return;
        if (Date.now() - lastUpdate < debounceTime) {
            setDebounceTimeout();
        } else {
            saveItemProperty();
        }
    }, { deep: true });
});

function setDebounceTimeout() {
    debounceTimeout = setTimeout(() => {
        debounceTimeout = null;
        saveItemProperty();
    }, debounceTime);
}

async function saveItemProperty() {
    lastUpdate = Date.now();
    if (saving) {
        setDebounceTimeout();
        return;
    }
    saving = true;
    let result = await serverMethods.itemProperty.saveItemProperty(props.itemProperty);
    if (checkAndShowHttpError(result))
        return;
    props.itemProperty.guid = result.data.guid;
    saving = false;
}


</script>
<template>
    <div class="item-property row">
        <template v-if="!standardProp">
            <input class="property-name" type="text" v-model="props.itemProperty.name" />
            <ItemPropertyTypeSelector :item-property="props.itemProperty" />
        </template>
        <ItemPropertyValueInput :item-property="props.itemProperty" v-if="props.itemProperty.typeName" :placeholder="props.placeholder" />
        <div v-else></div>
        <div v-if="!standardProp">
            <v-icon :icon="mdiTrashCanOutline" class="delete-button"
                @click="emit('deleteClicked', props.itemProperty)" />
        </div>
    </div>
</template>
<style lang="scss">
.item-property {
    .delete-button {
        cursor: pointer;
        transition: .1s all;
        border-radius: 3px;
        padding: 2px;

        &:hover {
            background: gainsboro;

        }
    }
}
</style>
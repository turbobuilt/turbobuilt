<script lang="ts" setup>
import RenderSfc from '@/components/RenderSfc.vue';
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import itemProperty from '@/serverTypes/itemProperty';
import { ItemProperty } from '@/serverTypes/itemProperty/ItemProperty.model';
import { ItemPropertyType } from '@/serverTypes/itemPropertyType/ItemPropertyType.model';
import { store } from '@/store';
import { reactive, watch } from 'vue';
import { clientComponentsRendered } from '@/lib/compiler/clientComponentsCompiled';


const props = defineProps<{
    itemProperty: ItemPropertyInfo;
}>();

const d = reactive({
    itemPropertyType: null as ItemPropertyType ,
    loading: false
})

async function getItemPropertyType(guid) {
    if (!store.itemPropertyTypes.get(guid)) {
        d.loading = true;
        store.itemPropertyTypes.set(guid, new Promise(async (resolve, reject) => {
            let result = await serverMethods.itemPropertyType.getItemPropertyType(guid);
            if (checkAndShowHttpError(result)) {
                resolve(null);
                return;
            }
            resolve(result.data);
        }))
    }
    d.itemPropertyType = await store.itemPropertyTypes.get(guid);
    if (d.itemPropertyType == null) {
        store.itemPropertyTypes.delete(guid);
    }
}

watch(() => props.itemProperty?.type, function (newVal, oldVal) {
    if (newVal !== oldVal && oldVal) {
        props.itemProperty.value = { data: null };
    }
    if (!props.itemProperty.value)
        props.itemProperty.value = { data: null };
    if (props.itemProperty.builtIn)
        return;
    getItemPropertyType(props.itemProperty.type);
}, { immediate: true });

import { ItemPropertyInfo } from '../../type';
function getSfc() {
    if (props.itemProperty.typeName === "Images") {
        return clientComponentsRendered.Media;
    } else if (clientComponentsRendered[props.itemProperty.typeName] && props.itemProperty.builtIn) {
        // console.log("built in", props.itemProperty.typeName, clientComponents[props.itemProperty.typeName])
        return clientComponentsRendered[props.itemProperty.typeName];
    }
    return d.itemPropertyType.inputComponent;
}
</script>
<template>
    <div class="item-property-value-input" v-if="props.itemProperty.builtIn || d.itemPropertyType">
        <!-- {{ getSfc() }} -->
        <RenderSfc :sfc="getSfc()" :workspaceFilePath="null" v-model="props.itemProperty.value.data" />
    </div>
</template>
<style lang="scss">
.item-property-value-input {
}
</style>
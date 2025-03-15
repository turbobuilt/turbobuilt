<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import { ItemProperty } from '@/serverTypes/itemProperty/ItemProperty.model';
import { ItemPropertyType } from '@/serverTypes/itemPropertyType/ItemPropertyType.model';
import { onMounted, reactive } from 'vue';

const props = defineProps<{
    omit?: string[];
    itemProperty: ItemProperty & {
        builtIn?: boolean;
        typeName?: string;
    }
}>()

const d = reactive({
    itemPropertyTypes: null as (ItemPropertyType | { builtIn: string, guid: null, name: string })[],
    loading: true,
})


async function getItemPropertyTypes() {
    d.loading = true;
    let result = await serverMethods.itemPropertyType.getItemPropertyTypeList({ page: 1, perPage: 1000, omitBuiltIn: false });
    d.loading = false;
    if (checkAndShowHttpError(result)) {
        return;
    }

    if (props.omit) {
        result.data.itemPropertyTypes = result.data.itemPropertyTypes.filter(ipt => !props.omit.includes(ipt.name));
    }
    d.itemPropertyTypes = result.data.itemPropertyTypes.filter(ipt => ipt.name !== "Images");
}

onMounted(() => {
    getItemPropertyTypes();
})

function selected(event){
    console.log("the props i", props)
    props.itemProperty.type = event.target.value;
    let type = d.itemPropertyTypes.find(ipt => ipt.guid === event.target.value);
    props.itemProperty.typeName = type.name;
    props.itemProperty.builtIn = type.builtIn as any;
}

</script>
<template>
    <div class="item-property-type-selector" v-if="props.itemProperty">
        <select @change="selected($event)" v-model="props.itemProperty.type">
            <option value=""></option>
            <option v-for="type of d.itemPropertyTypes" :value="type.guid">{{ type.name }}</option>
        </select>
    </div>
</template>
<style lang="scss">
.item-property-type-selector {
    display: flex;
    select {
        width: 100%;
        border: 1px solid gray;
        padding: 3px 5px;
        border-radius: 2px;
        &:active {
            outline: none;
        }
    }
}
</style>
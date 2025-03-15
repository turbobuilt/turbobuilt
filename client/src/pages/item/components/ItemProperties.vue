<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import { Item } from '@/serverTypes/item/Item.model';
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import ItemPropertyComponent from './components/ItemPropertyComponent.vue';
import { ItemProperty } from '@/serverTypes/itemProperty/ItemProperty.model';
import { ItemPropertyInfo } from './type';


const props = defineProps<{
    item: Item;
    websiteGuid?: string;
}>()

const itemPropertiesTable = ref(null);

const emit = defineEmits(["init"])

const d = reactive({
    itemProperties: null as ItemPropertyInfo[],
    loading: false,
    newItemProperty: new ItemProperty(),
    saving: false
});

const imagesProperty = computed(() => props.websiteGuid ? null : d.itemProperties?.find(prop => prop.typeName === "Images" && prop.systemUse == true));
const descriptionProperty = computed(() => d.itemProperties?.find(prop => prop.name === "Description" && prop.systemUse == true));
const priceTableProperty = computed(() => d.itemProperties?.find(prop => prop.name === "PriceTable" && prop.systemUse == true));
const systemProperties = computed(() => [imagesProperty.value, descriptionProperty.value, priceTableProperty.value]);
const extraProperties = computed(() => {
    console.log("extraProperties", d.itemProperties?.filter(prop => !systemProperties.value.includes(prop)))
    return d.itemProperties?.filter(prop => !systemProperties.value.includes(prop))
});

async function getItemProperties() {
    d.loading = true;
    let result = await serverMethods.itemProperty.getItemPropertiesForItem({
        page: 1,
        perPage: 1000,
        websiteGuid: props.websiteGuid
    }, props.item.guid);
    d.loading = false;
    if (checkAndShowHttpError(result)) {
        return;
    }
    if (!props.websiteGuid) {

    }
        
    d.itemProperties = result.data.itemProperties;
    if (!imagesProperty.value && !props.websiteGuid) { 
        let imagesProperty = new ItemProperty() as ItemPropertyInfo;
        imagesProperty.item = props.item.guid;
        imagesProperty.name = "Images";
        imagesProperty.website = props.websiteGuid;
        imagesProperty.typeName = "Images";
        imagesProperty.builtIn = true;
        imagesProperty.systemUse = true;
        d.itemProperties.push(imagesProperty);
    }
    if (!descriptionProperty.value && !props.websiteGuid) {
        createDescriptionProperty();
    }
    if (!priceTableProperty.value && !props.websiteGuid) {
        let priceTableProperty = new ItemProperty() as ItemPropertyInfo;
        priceTableProperty.item = props.item.guid;
        priceTableProperty.name = "PriceTable";
        priceTableProperty.website = props.websiteGuid;
        priceTableProperty.typeName = "PriceTable";
        priceTableProperty.builtIn = true;
        priceTableProperty.systemUse = true;
        d.itemProperties.push(priceTableProperty);
    }
}

const last = computed(() => extraProperties.value[extraProperties.value.length - 1]);

async function addItemPropertyIfEmpty() {
    let newItemProperty = new ItemProperty();
    newItemProperty.item = props.item.guid;
    newItemProperty.website = props.websiteGuid;
    d.itemProperties.push(newItemProperty);
    nextTick(() => {
        console.log("adding")
        itemPropertiesTable.value.querySelector(`.row-${extraProperties.value.length - 1} .property-name`).focus()
    })
}

async function saveItemPropertyList() {
    if (d.saving)
        return;
    d.saving = true;
    let result = await serverMethods.itemProperty.saveItemPropertyList(props.item.guid, d.itemProperties, props.websiteGuid);
    d.saving = false;
    if (checkAndShowHttpError(result))
        return;
    d.itemProperties.forEach((itemProperty, index) => itemProperty.guid = result.data[index].guid)
}

emit("init", { saveItemPropertyList });

onMounted(() => {
    getItemProperties();
})

async function deleteClicked(itemProperty: ItemProperty, index: number) {
    let trueIndex = d.itemProperties.indexOf(itemProperty);
    let sliced = d.itemProperties.splice(trueIndex, 1);
    let response = await serverMethods.itemProperty.deleteItemProperty(itemProperty.guid);
    if (checkAndShowHttpError(response)) {
        d.itemProperties.splice(index, 0, ...sliced);
    }
}
function createDescriptionProperty() {
    let descriptionProperty = new ItemProperty() as ItemPropertyInfo;
    descriptionProperty.item = props.item.guid;
    descriptionProperty.website = props.websiteGuid;
    descriptionProperty.typeName = "RichText";
    descriptionProperty.name = "Description";
    descriptionProperty.builtIn = true;
    descriptionProperty.systemUse = true;
    d.itemProperties.push(descriptionProperty);
}

function overrideDescriptionToggled(value) {
    if (value) {
        if (!descriptionProperty.value) {
            createDescriptionProperty();
        }
    } else {
        let index = d.itemProperties.findIndex(prop => prop.name === "Description" && prop.systemUse == true);
        if (index >= 0) {
            let sliced = d.itemProperties.splice(index, 1);
            if (sliced[0].guid) {
                let response = serverMethods.itemProperty.deleteItemProperty(sliced[0].guid);
                if (checkAndShowHttpError(response)) {
                    d.itemProperties.splice(index, 0, ...sliced);
                }
            }
        }
    }
}
</script>
<template>
    <div class="item-properties">
        <div v-if="d.loading">
            Loading...
        </div>
        <div v-else-if="d.itemProperties">
            <ItemPropertyComponent v-if="imagesProperty" :item-property="imagesProperty" @delete-clicked="deleteClicked(imagesProperty, 0)" :standardProp="true" />
            <ItemPropertyComponent v-if="priceTableProperty" :item-property="priceTableProperty" :standardProp="true" />
            <v-checkbox label="Override Description" :modelValue="!!descriptionProperty" @update:modelValue="overrideDescriptionToggled" hide-details="auto" density="compact" v-if="websiteGuid"/>
            <div class="description" v-if="descriptionProperty">
                <h4 >Description</h4>
                <ItemPropertyComponent v-if="descriptionProperty" :item-property="descriptionProperty" @delete-clicked="deleteClicked(descriptionProperty, 0)" :standardProp="true" placeholder="Enter description here."/>
            </div>

            <h4 style="margin: 30px 0 10px;">Custom Properties</h4>
            <div class="item-properties-table" ref="itemPropertiesTable">
                <div class="row">
                    <div>Property Name</div>
                    <div>Type</div>
                    <div>Value</div>
                </div>
                <ItemPropertyComponent v-for="(itemProperty, index) in extraProperties" :key="itemProperty.guid" :item-property="itemProperty" :class="[`row-${index}`]" @delete-clicked="deleteClicked(itemProperty, index)"/>
                <div class="row" v-if="!last || last.guid || last.name">
                    <input @focus="addItemPropertyIfEmpty()" />
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.item-properties {
    flex-shrink: 1;
    flex-grow: 1;
    min-width: 0;
    .description {
        margin: 10px 0 5px;
        h4 {
            margin-bottom: 5px;
        }
        input, textarea {
            border: 1px solid #ccc;
        }
    }
    .item-properties-table {
        display: flex;
        flex-direction: column;
        width: 100%;
        // first child

        input {
            border: 1px solid #ccc;
            border-radius: 0;
            padding: 5px 8px;
            line-height: 1;
            max-width: 100%;
        }
        .row {
            display: flex;
            padding: 5px;
            &:nth-child(even) {
                background: #f9f9f9;
            }
            // >* {
            //     display: table-cell;
            //     padding: 5px;
            //     border-bottom: 1px solid #ccc;
            //     max-width: 100%;
            // }
            //first child
            > * {
                min-width: 0;
                padding: 1px;
            }
            >:nth-child(1) {
                min-width: 0;
                width: 33%;
                max-width: 200px;
                flex-shrink: 1;
            }
            >:nth-child(2) {
                min-width: 0;
                width: 33%;
                max-width: 100px;
                flex-shrink: 1;
            }
            >:nth-child(3) { // value
                flex: 1;
            }
            >:nth-child(4) { // trash
                width: 25px;
                flex-shrink: 0;
            }
        }
    }
}
</style>
<script lang="ts" setup>
import { onMounted, reactive } from 'vue';
import MonacoVue from '../workspace/components/MonacoVue.vue';
import itemProperty from '@/serverTypes/itemProperty';
import { ItemPropertyType } from '@/serverTypes/itemPropertyType/ItemPropertyType.model';
import router from '@/router/router';
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import RenderSfc from "@/components/RenderSfc.vue"
import { itemPropertyTypesChannel, store } from '@/store';
import { showConfirm } from '@/components/ShowModal/showModal';

const d = reactive({
    itemPropertyType: null as ItemPropertyType,
    loading: true,
    saving: false,
})

async function getItemPropertyType() {
    if (router.currentRoute.value.params.guid === "new") {
        d.itemPropertyType = new ItemPropertyType();
        d.loading = false;
    } else {
        d.loading = true;
        let result = await serverMethods.itemPropertyType.getItemPropertyType(router.currentRoute.value.params.guid as string);
        d.loading = false;
        if (checkAndShowHttpError(result)) {
            return;
        }
        d.itemPropertyType = result.data;
    }
}

async function saveItemPropertyType() {
    if (d.saving)
        return;
    d.saving = true;
    let result = await serverMethods.itemPropertyType.saveItemPropertyType(d.itemPropertyType);
    d.saving = false;
    if (checkAndShowHttpError(result)) {
        return;
    }
    if (router.currentRoute.value.params.guid === "new") {
        d.itemPropertyType.guid = result.data.guid;
        router.replace(`/item-property-type/${result.data.guid}`);
    }
    itemPropertyTypesChannel.postMessage(JSON.stringify({ deleted: d.itemPropertyType.guid }));
}

onMounted(async () => {
    await router.isReady();
    setTimeout(() => {
        getItemPropertyType();
    }, 1);
});

function compiled({ js, css }) {
    d.itemPropertyType.inputComponentCompiledJs = js;
    d.itemPropertyType.inputComponentCompiledCss = css;
}

async function deleteItemPropertyType() {
    if (await showConfirm({ title: "Confirm?", content: `Are you sure you want to delete this item property type: ${d.itemPropertyType.name}?  This will mess up anything that uses it.`})) {
        if (d.saving)
            return;
        d.saving = true;
        let result = await serverMethods.itemPropertyType.deleteItemPropertyType(d.itemPropertyType.guid);
        d.saving = false;
        if (checkAndShowHttpError(result)) {
            return;
        }
        router.replace(`/item-property-type`);
    }
}

</script>
<template>
    <div class="loading-container" v-if="d.loading">
        <v-progress-circular :indeterminate="true" :size="18" />
    </div>
    <div v-else-if="d.itemPropertyType.builtIn" class="item-property-type-page">
        <div style="padding: 10px;">This is a built in type and cannot currently be edited.</div>
    </div>
    <div class="item-property-type-page" v-else v-ctrl-s="saveItemPropertyType">
        <div class="buttons-row">
            <v-btn @click="saveItemPropertyType()" color="primary">
                <v-progress-circular inderminate :size="18" v-if="d.saving" />
                <div v-else>Save</div>
            </v-btn>
            <v-spacer />
            <v-btn @click="deleteItemPropertyType()" size="small">
                <v-progress-circular inderminate :size="18" v-if="d.saving" />
                <div v-else>Delete</div>
            </v-btn>
        </div>
        <v-text-field v-model="d.itemPropertyType.name" label="Name" hide-details="auto" />
        <RenderSfc :workspaceGuid="null" :workspaceFilePath="null" :sfc="d.itemPropertyType?.inputComponent" v-if="d.itemPropertyType?.inputComponent" @compile="compiled" />
        <MonacoVue v-model="d.itemPropertyType.inputComponent" />
    </div>
</template>
<style lang="scss">
.item-property-type-page {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    .buttons-row {
        display: flex;
        align-items: center;
    }
}
</style>
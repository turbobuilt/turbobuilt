<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import router from '@/router/router';
import { Organization } from '@/serverTypes/organization/Organization.model';
import { saveUserState, store } from '@/store';
import { computed, onMounted, reactive, watch } from 'vue';

const d = reactive({
    organizations: null as Organization[],
    showingOrganizationsList: false,
})

async function getOrganizations() {
    let result = await serverMethods.organization.getOrganizationList();
    if (checkAndShowHttpError(result)) {
        return;
    }
    store.organizations = result.data.items;
    d.organizations = result.data.items;
}

watch(() => store.user?.guid, async (newVal, oldVal) => {
    if (!newVal) {
        d.organizations = null;
    } else {
        d.organizations = null;
        await getOrganizations();
        setCurrentOrganization(store.userState?.currentOrganization);
    }
}, { immediate: true })

watch(() => store.userState?.currentOrganization, async (newVal, oldVal) => {
    setCurrentOrganization(newVal);
}, { immediate: true });

async function setCurrentOrganization(guid: string) {
    if (store.userState.currentOrganization && store.userState.currentOrganization === guid) {
        return;
    }
    d.showingOrganizationsList = false;
    store.userState.currentOrganization = guid;
    const [workspaceResult] = await Promise.all([
        serverMethods.workspace.getDefaultWorkspace(),
        saveUserState()
    ]);
    store.mainEditorCurrentWorkspaceGuid = workspaceResult.data.workspace.guid;

    console.log("setting")
    router.go(0)
}

const currentOrganization = computed(() => {
    return d.organizations?.find(o => o.guid === store?.userState?.currentOrganization);
})

</script>
<template>
    <div class="click-background" v-if="d.showingOrganizationsList" @click="d.showingOrganizationsList = false"></div>
    <div class="organization-picker">
        <template v-if="store.userState && d.organizations">
            <div @click="d.showingOrganizationsList = !d.showingOrganizationsList" class="organization-picker-current">
                <span class="current-org-name">{{ currentOrganization?.name || "Select Org" }}</span>
            </div>
            <div v-if="d.showingOrganizationsList" class="dropdown" @click="d.showingOrganizationsList = false">
                <router-link to="/organization">Manage</router-link>
                <div v-for="organization of d.organizations" @click.stop="setCurrentOrganization(organization.guid)">
                    {{ organization.name }}
                </div>
            </div>
        </template>
    </div>
</template>
<style lang="scss">
@import "@/scss/variables.module.scss";
.click-background {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 4;
}
.current-org-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.organization-picker {
    position: relative;
    z-index: 5;
    display: flex;
    color: white;
    .organization-picker-current {
        display: flex;
        align-items: center;
        padding: 3px 8px;
        cursor: pointer;
        transition: background 0.1s;
        width: 150px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        display: flex;
        align-items: center;
        padding: 3px 8px;
        cursor: pointer;
        transition: background 0.1s;
        &:hover {
            background: darken($primary, 10%);
        }
    }
    .dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: $primary;
        border: 1px solid #ccc;
        border-top: none;
        border-radius: 4px;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 100;
        >* {
            color: white;
            display: block;
            text-decoration: none;
            padding: 10px 10px;
            line-height: 1;
            cursor: pointer;
            transition: background 0.1s;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            &:hover {
                background: darken($primary, 10%);
            }
        }
    }
}
</style>
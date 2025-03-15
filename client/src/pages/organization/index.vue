<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { reactive } from 'vue';
import { onMounted } from 'vue';
import { serverMethods } from '@/lib/serverMethods';
import MainMenu from '@/components/MainMenu/MainMenu.vue';

const d = reactive({
    loading: false,
    organizations: null as any[],
})

async function getOrganizations() {
    d.loading = true;
    let result = await serverMethods.organization.getOrganizationList();
    d.loading = false;
    if (checkAndShowHttpError(result))
        return;
    d.organizations = result.data.items;
}

onMounted(() => {
    getOrganizations();
})

</script>
<template>
    <MainMenu />
    <div class="organization-list-page">
        <div class="info-row">
            <div></div>
            <v-btn color="primary" to="/organization/new">
                Create New
            </v-btn>
        </div>
        <div class="loading-container" v-if="d.loading">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
        <div v-else-if="d.organizations?.length > 0" class="item-cards">
            <div v-for="organization of d.organizations" class="card-container">
                <v-card :to="`/organization/${organization.guid}`" :key="organization.id">
                    <v-card-title>
                        {{ organization.name }}
                    </v-card-title>
                </v-card>
            </div>
        </div>
        <div class="nothing-container" v-else>
            <div>No organizations found.</div>
            <br>
            <v-btn to="/organization/new" color="primary">Create One!</v-btn>
        </div>
    </div>
</template>
<style lang="scss">
.organization-list-page {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        padding: 10px;
    }
    .item-cards {
        display: flex;
        flex-wrap: wrap;
        .card-container {
            width: 33.3333%;
            padding: 10px;
        }
    }
    .nothing-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex-grow: 1;
        v-btn {
            margin-top: 10px;
        }
    }
}
</style>
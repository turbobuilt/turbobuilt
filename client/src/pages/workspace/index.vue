<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { reactive } from 'vue';
import { onMounted } from 'vue';
import { serverMethods } from '@/lib/serverMethods';

const d = reactive({
    loading: false,
    workspaces: null as any[],
})

async function getWorkspaces() {
    d.loading = true;
    let result = await serverMethods.workspace.getWorkspaceList();
    d.loading = false;
    if (checkAndShowHttpError(result))
        return;
    d.workspaces = result.data.items;
}

onMounted(() => {
    getWorkspaces();
})

</script>
<template>
    <div class="workspace-list-page">
        <MainMenu />
        <!-- <div>{{ d.workspaces.length }}</div> -->
        <div class="loading-container" v-if="d.loading">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
        <template v-else>
            <div class="list-top-buttons-row">
                <div></div>
                <v-btn to="/workspace/new" color="primary">New Workspace</v-btn>
            </div>
            <div v-if="d.workspaces?.length > 0" class="item-cards">
                <div v-for="workspace of d.workspaces" class="card-container">
                    <v-card :to="`/workspace/${workspace.guid}`" :key="workspace.id">
                        <v-card-title>
                            {{ workspace.name }}
                        </v-card-title>
                    </v-card>
                </div>
            </div>
            <div class="nothing-container" v-else>
                <div>No workspaces found.</div>
                <br>
                <v-btn to="/workspace/new" color="primary">Create One!</v-btn>
            </div>
        </template>
    </div>
</template>
<style lang="scss">
.workspace-list-page {
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
<script lang="ts" setup>
import { showAlert } from '@/components/ShowModal/showModal';
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import router from '@/router/router';
import { onMounted, reactive } from 'vue';

const d = reactive({

});


onMounted(() => {
    console.log("Accept Invitation Page");
    if (!localStorage.getItem("invitationToken")) {
        showAlert({ title: "Error", content: "No invitation token found." });
        router.push('/login');
        return;
    }
});

async function acceptInvitation() {
    let result = await serverMethods.organizationInvitation.acceptInvitation(localStorage.getItem("invitationToken"));
    if (checkAndShowHttpError(result)) {
        return;
    }
    showAlert({ title: "Success", content: "Invitation accepted." });
    localStorage.removeItem("invitationToken");
    router.push('/dashboard');
}

async function rejectInvitation() {
    let result = await serverMethods.organizationInvitation.rejectInvitation(localStorage.getItem("invitationToken"));
    if (checkAndShowHttpError(result)) {
        return;
    }
    showAlert({ title: "Success", content: "Invitation rejected." });
    localStorage.removeItem("invitationToken");
    router.push('/login');
}
</script>
<template>
    <div class="accept-invitation-page">
        <h1>Accept Invitation</h1>
        <div class="buttons">
            <v-btn color="primary" @click="acceptInvitation">Accept Invitation</v-btn>
            <v-btn color="danger" @click="rejectInvitation">Reject Invitation</v-btn>
        </div>
    </div>
</template>
<style lang="scss">
.accept-invitation-page {
    padding: 10px;
    .buttons {
        display: flex;
        justify-content: center;
        padding: 0 5px;
        v-btn {
            margin-right: 5px;
        }
    }
}
</style>
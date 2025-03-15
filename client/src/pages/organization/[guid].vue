<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { computed, reactive } from 'vue';
import { onMounted } from 'vue';
import { serverMethods } from '@/lib/serverMethods';
import { router } from "@/router/router";
import { Organization } from '@/serverTypes/organization/Organization.model';
import { store } from '@/store';
import { showConfirm } from '@/components/ShowModal/showModal';
import MainMenu from '@/components/MainMenu/MainMenu.vue';

const d = reactive({
    loading: false,
    organization: null as Organization,
    saving: false,
    members: null as any[],
    invited: null as any[],
    checkingStripeStatus: false,
    newUser: {
        email: "",
        name: ""
    },
    showingInviteUser: false,
    stripeOnboardingComplete: false,
    startingStripeOnboarding: false
})

async function getOrganization(guid: string) {
    d.loading = true;
    let result = await serverMethods.organization.getOrganization(guid);
    d.loading = false;
    if (checkAndShowHttpError(result))
        return;
    d.organization = result.data.organization;
    d.stripeOnboardingComplete = result.data.stripeOnboardingComplete;
}

async function getOrganizationMembers() {
    let result = await serverMethods.organization.getUserOrganizationList(router.currentRoute.value.params.guid as string);
    if (checkAndShowHttpError(result))
        return;
    d.members = result.data.items
}
async function getOrganizationInvitationList() {
    let result = await serverMethods.organizationInvitation.getOrganizationInvitationList(router.currentRoute.value.params.guid as string);
    if (checkAndShowHttpError(result))
        return;
    d.invited = result.data.items
}

async function saveOrganization() {
    if (d.saving)
        return;
    d.saving = true;
    let result = await serverMethods.organization.saveOrganization(d.organization);
    d.saving = false;
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.organization.guid = result.data.guid;
    if (router.currentRoute.value.params.guid === "new") {
        router.replace(`/organization/${result.data.guid}`);
        d.members = [];
        d.invited = [];
    }
}

async function addUser() {
    if (d.newUser.email === "")
        return;
    let result = await serverMethods.organizationInvitation.saveOrganizationInvitation(d.organization.guid, d.newUser.email, d.newUser.name);
    if (checkAndShowHttpError(result))
        return;
    d.newUser.email = "";
    d.newUser.name = "";
    getOrganizationInvitationList();
}

async function deleteOrganizationInvitation(organizationInvitationGuid: string) {
    let result = await serverMethods.organizationInvitation.deleteOrganizationInvitation(d.organization.guid, organizationInvitationGuid);
    if (checkAndShowHttpError(result))
        return;
    getOrganizationInvitationList();
}
async function deleteOrganizationMember(userOrganizationGuid: string) {
    if (!await showConfirm({ title: "Are you sure?", content: "Do you really want to remove this user from the organization?" }))
        return;
    let result = await serverMethods.userOrganization.deleteUserOrganization(userOrganizationGuid);
    if (checkAndShowHttpError(result))
        return;
    getOrganizationMembers();
}
onMounted(async () => {
    await router.isReady();
    if (router.currentRoute.value.params.guid === "new") {
        d.organization = new Organization();
    } else {
        await Promise.all([
            getOrganization(router.currentRoute.value.params.guid as string),
            getOrganizationMembers(),
            getOrganizationInvitationList()
        ]);
        if (router.currentRoute.value.query.stripe_return === "true") {
            // check stripe status
            d.checkingStripeStatus = true;
            let result = await serverMethods.payment.stripe.checkStripeOnboardingStatus(d.organization.guid);
            d.checkingStripeStatus = false;
            if (checkAndShowHttpError(result)) {
                return;
            }
            d.stripeOnboardingComplete = result.data.complete;
        }
    }
});

async function startStripeOnboarding() {
    if (d.startingStripeOnboarding)
        return;
    d.startingStripeOnboarding = true;
    let result = await serverMethods.payment.stripe.startStripeOnboarding(d.organization.guid);
    if (checkAndShowHttpError(result)) {
        d.startingStripeOnboarding = false;
        return;
    }
    window.location.href = result.data.url;
}

async function appleDomainAssociationFileChanged(event) {

}

async function deleteOrganization() {
    if (await showConfirm({ title: "Are you sure?", content: "This will completely wipe out the organization, website, billing records, etc!" })) {
        let result = await serverMethods.organization.deleteOrganization(d.organization.guid);
        if (checkAndShowHttpError(result))
            return;
        router.back();
    }
}

const userGuid = computed(() => (store.user as any).guid);
</script>
<template>
    <div class="organization-page">
        <MainMenu />
        <div class="info-row">
            <v-btn color="white" @click="deleteOrganization" v-if="d.organization?.guid">
                <div v-if="!d.saving">Delete</div>
                <template v-else>
                    <v-progress-circular indeterminate color="white" :size="18" />
                </template>
            </v-btn>
            <div></div>
            <v-btn color="primary" @click="saveOrganization">
                <div v-if="!d.saving">Save</div>
                <template v-else>
                    <v-progress-circular indeterminate color="white" :size="18" />
                </template>
            </v-btn>
        </div>
        <div v-if="d.organization" style="padding: 10px;">
            <v-text-field v-model="d.organization.name" label="Name" hide-details="auto" />
            <v-card style="margin: 10px 0;">
                <v-card-title>Organization Members</v-card-title>
                <v-card-text>
                    <div class="invites-container">
                        <template v-if="d.invited?.length > 0">
                            <div class="members-title">Pending Users</div>
                            <div class="members">
                                <div v-for="user in d.invited" :key="user.guid" class="member">
                                    <div>{{ user.email }}</div>
                                    <div class="remove" @click="deleteOrganizationInvitation(user.guid)">❌</div>
                                </div>
                            </div>
                        </template>
                        <div style="display: flex; max-width: 650px;" v-if="d.showingInviteUser">
                            <v-text-field v-model="d.newUser.email" density="compact" label="New user email"
                                hide-details="auto" :autofocus="true" />
                            <v-text-field v-model="d.newUser.name" density="compact" label="New user name"
                                hide-details="auto" />
                            <v-btn color="primary" @click="addUser" class="add-user-button">Invite user</v-btn>
                            <v-btn style="height: auto;" @click="d.showingInviteUser = false">Cancel</v-btn>
                        </div>
                        <div style="padding: 5px 0" v-else>
                            <v-btn size="small" color="primary" @click="d.showingInviteUser = true">Invite new
                                user</v-btn>
                        </div>
                    </div>
                    <div class="members-container">
                        <div class="members-title">Organization Members</div>
                        <div class="members">
                            <div v-for="user in d.members" :key="user.guid" class="member">
                                <div>{{ user.email }}</div>
                                <div v-if="user.guid !== userGuid" class="remove"
                                    @click="deleteOrganizationMember(user.guid)">❌
                                </div>
                            </div>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
            <v-card style="margin: 10px 0;">
                <v-card-title>Stripe Payment Processing</v-card-title>
                <v-card-text v-if="d.checkingStripeStatus">
                    <v-progress-circular indeterminate></v-progress-circular>
                </v-card-text>
                <v-card-text>
                    <div v-if="d.stripeOnboardingComplete">
                        <div>✅ Stripe onboarding is complete</div>
                    </div>
                    <div v-else>
                        <div>Stripe onboarding is not complete</div>
                        <br>
                        <v-btn color="primary" @click="startStripeOnboarding()">
                            <div v-if="!d.startingStripeOnboarding">Complete onboarding</div>
                            <template v-else>
                                <v-progress-circular indeterminate color="white" :size="18" />
                            </template>
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
            <v-card style="margin: 10px 0;" v-if="d.stripeOnboardingComplete">
                <v-card-title>Apple Pay</v-card-title>
                <v-card-text>
                    <div style="margin-bottom: 6px;">Upload the apple-domain-association file to verify your domain for
                        Apple
                        Pay</div>
                    <div style="margin-bottom: 5px;">
                        <a target="_blank"
                            href="https://docs.stripe.com/payments/payment-methods/pmd-registration#verify-domain-with-apple">Download
                            it here</a>
                    </div>
                    <input type="file" id="apple-domain-association-file"
                        @change="appleDomainAssociationFileChanged()" />
                </v-card-text>
            </v-card>
        </div>
        <div v-else class="loading-page">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
    </div>
</template>
<style lang="scss">
.organization-page {
    .add-user-button {
        height: auto;
        border-radius: 0;
    }

    .members-container,
    .invites-container {
        //padding: 5px;
        //margin: 5px;
        // box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.65);
        border-radius: 5px;

        .members-title {
            margin: 5px 0 5px;
        }

        .member {
            display: flex;
            justify-content: space-between;
            margin: 2px;
            padding: 5px;
            align-items: center;

            .remove {
                cursor: pointer;
                padding: 4px;
                border-radius: 3px;
                transition: .1s background-color;

                &:hover {
                    background-color: #f0f0f0;
                }
            }

            &:nth-child(odd) {
                background-color: #f0f0f0;
            }
        }
    }
}
</style>
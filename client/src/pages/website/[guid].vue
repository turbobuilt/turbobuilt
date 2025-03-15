<script lang="ts" setup>
import { checkAndShowHttpError } from '@/lib/checkAndShowHttpError';
import { serverMethods } from '@/lib/serverMethods';
import router from '@/router/router';
import { onMounted, reactive, watch } from 'vue';
import { Website } from '@/serverTypes/website/Website.model';
import { showAlert, showConfirm } from '@/components/ShowModal/showModal';
import WebsiteProperties from './components/WebsiteProperties.vue';
import { mdiCheck, mdiContentCopy } from '@mdi/js';
import MainMenu from '@/components/MainMenu/MainMenu.vue';

const d = reactive({
    website: null as Website,
    loading: false,
    saving: false,
    activating: false,
    activated: null,
    saveWebsitePropertyList: null as Function,
    domains: [],
    dkimPublicKeyRecord: "",
    showCopied: false
})

async function getWebsite() {
    if (router.currentRoute.value.params.guid === "new") {
        d.website = new Website();
        d.activated = false;
    } else {
        d.loading = true;
        let result = await serverMethods.website.getWebsite(router.currentRoute.value.params.guid as string);
        d.loading = false;
        if (checkAndShowHttpError(result)) {
            return;
        }
        d.website = result.data;
        checkTlsStatus();
    }
}

async function saveWebsite() {
    if (d.saving)
        return;
    d.saving = true;
    let result = await serverMethods.website.saveWebsite(d.website);
    // await d.saveWebsitePropertyList();
    d.saving = false;
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.website.guid = result.data.guid;
    if (router.currentRoute.value.params.guid === "new") {
        router.replace(`/website/${result.data.guid}`);
    }
    // getDkimPublicKey();
}

async function activateWebsite() {
    console.log("will activate")
    if (d.activating)
        return;

    d.activating = true;
    let turbobuiltIpResult = await serverMethods.util.getTurbobuiltIp();
    if (!await showConfirm({ title: "Make A records", content: `Please make sure you have added A records to ${d.website.domain} and www.${d.website.domain} pointing to ${turbobuiltIpResult.data.ip}. If you don't know how to do this, please contact the company where you bought your domain or search the internet for how to do it with your domain registrar.  This is ncessary so that your domain points to our servers so we can show your website. Once you do this, you can continue`, confirmText: "Continue" })) {
        d.activating = false;
        return;
    }
    let result = await serverMethods.website.activateWebsite(d.website.guid);
    if (checkAndShowHttpError(result)) {
        return;
    }
    await checkTlsStatus();
    d.activating = false;
}

async function checkTlsStatus() {
    let result = await serverMethods.website.checkTlsStatus(d.website.guid);
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.activated = result.data.tlsActivated;
}

function propertiesInitialized({ saveWebsitePropertyList }) {
    d.saveWebsitePropertyList = saveWebsitePropertyList;
}

onMounted(() => {
    getWebsite();
});

async function getDkimPublicKey() {
    if (!d.website.guid || !d.website.domain) {
        return;
    }
    let result = await serverMethods.dkimKey.getDkimKeyForWebsite(d.website.guid);
    if (checkAndShowHttpError(result)) {
        return;
    }
    d.dkimPublicKeyRecord = `v=DKIM1;h=sha256;k=rsa;p=${result.data.publicKey}`
}

watch(() => d?.website?.guid, (newVal) => {
    if (!newVal) {
        return;
    }
    if (d.website.domain) {
        // getDkimPublicKey();
    }
})

function copyDkimPublicKey() {
    navigator.clipboard.writeText(d.dkimPublicKeyRecord);
    d.showCopied = true;
    setTimeout(() => {
        d.showCopied = false;
    }, 2000);
    // showAlert({ title: "Copied", content: "Dkim public key copied to clipboard" });
}
</script>
<template>
    <div class="website-page">
        <MainMenu />
        <div v-if="!d.website" class="loading-container">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
        <div v-if="d.website">
            <div class="buttons">
                <v-btn v-if="d.activated === false && d.website.domain" @click="activateWebsite">
                    <div v-if="!d.activating">Activate</div>
                    <template v-else>
                        <v-progress-circular indeterminate color="white" :size="18" />
                    </template>
                </v-btn>
                <div style="width: 10px;"></div>
                <div></div>
                <v-btn color="primary" @click="saveWebsite">
                    <div v-if="!d.saving">Save</div>
                    <template v-else>
                        <v-progress-circular indeterminate color="white" :size="18" />
                    </template>
                </v-btn>
            </div>
            <br>
            <v-text-field v-model="d.website.name" label="Name" hide-details="auto" />
            <v-text-field v-model="d.website.domain" label="Domain" hide-details="auto" />
            <div class="dkim-key-display" v-if="d.dkimPublicKeyRecord">
                <label style="display: flex; align-items: center; padding: 4px 0;">
                    <div @click="copyDkimPublicKey" style="cursor: pointer;">
                        <div icon v-if="!d.showCopied">
                            <v-icon :icon="mdiContentCopy" />
                        </div>
                        <div icon v-if="d.showCopied">
                            <v-icon :icon="mdiCheck" /> Copied
                        </div>
                    </div>
                    <div>Dkim Key</div>
                </label>
                <div>Selector: turbobuilt._domainkey</div>
                <div>{{ d.dkimPublicKeyRecord }}</div>
            </div>
            <!-- <WebsiteProperties :website="d.website" :websiteGuid="d.website.guid" @init="propertiesInitialized" /> -->
            <WebsiteWebsitePageTemplatesList :websiteGuid="d.website.guid" v-if="d.website?.guid" />
        </div>
    </div>
</template>
<style lang="scss">
.website-page {
    .dkim-key-display {
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        margin-top: 10px;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: monospace;
    }
    .buttons {
        display: flex;
        justify-content: flex-end;
        padding: 10px;
    }
    .loading-container {
        display: flex;
        justify-content: center;
        padding: 50px;
    }
}
</style>
<script lang="ts" setup>
import { reactive } from "vue"

const d = reactive({

    smtpSettings: {
        userName: "",
        password: ""
    }
});

</script>
<template>
    <div class="email-configuration">
        <v-card>
            <v-card-title>Transactional Email Settings</v-card-title>
            <v-card-text>
                <v-alert>Currently, we send emails regarding purchases, etc, through our internal systems. Configure your custom domain below.</v-alert>
            </v-card-text>
        </v-card>
        <v-card>
            <v-card-title>Marketing Email Settings</v-card-title>
            <v-card-text>
                <p>When you want to send a series of automated marketing emails, you'll need to bring a custom mail provider for now.  Please enter your SMTP settings below.</p>
                <v-text-field label="Username" v-model="d.smtpSettings.userName" />
                <v-text-field label="Password" v-model="d.smtpSettings.password" />
            </v-card-text>
        </v-card>
    </div>
</template>
<style lang="scss">
.email-configuration {

}
</style>
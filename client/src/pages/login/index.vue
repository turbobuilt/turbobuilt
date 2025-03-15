<script lang="ts" setup>
import GoogleLoginButton from './components/GoogleLoginButton.vue';
import { setUserData } from '@/lib/setUserData';
import { router } from '@/router/router';

async function loggedIn({ authToken, user, organizationList, userState }) {
    setUserData({ authToken, user, organizationList, userState });
    if (localStorage.getItem("invitationToken")) {
        router.push("/accept-invitation");
    } else {
        router.push('/dashboard');
    }
}

</script>
<template>
    <div class="login-page">
        <div>
            <h1>Welcome to Smart Host</h1>
        </div>
        <br>
        <div class="login-buttons">
            <GoogleLoginButton @login="loggedIn" />
        </div>
        <div></div>
    </div>
</template>
<style lang="scss">
.login-page {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100vh;
    .login-buttons {
        display: flex;
        flex-direction: column;
        width: 350px;
        max-width: 100%;
    }
}
</style>
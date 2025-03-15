<script lang="ts" setup>
import CodeEditor from "./components/CodeEditor/CodeEditor.vue";
import { store } from "./store";

</script>
<template>
    <v-app>
        <v-main>
            <router-view v-if="store.ready" />
            <CodeEditor :style="{ 'z-index': store.showMainEditor ? 10 : -10 }" v-if="store.ready && store.user && store.userState && store.organizations.length" />
        </v-main>
    </v-app>
</template>
<style lang="scss">
.list-top-buttons-row {
    padding: 5px;
    display: flex;
    justify-content: space-between;
}
.v-main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}
.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
}
.v-main {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    height: 100vh;
    min-height: 0;
}
html, body, #app, .v-application, .v-application__wrap, .v-main {
    height: 100vh;
    width: 100%;
    // overflow: hidden !important;
    background-color: white;
}
body {
    overflow: auto;
}
html {
    overflow: hidden;
}
* {
    line-height: 1;
}
p {
    line-height: 1.4;
}
.v-main {
    display: flex;
    flex-direction: column;
    flex-grow: 0;
    flex-shrink: 0;
}
.info-row {
    display: flex;
    padding: 5px;
    background: gainsboro;
    justify-content: space-between;
    flex-grow: 0;
}
.loading-page {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 50px;
}
body .v-row {
    margin: 0;
}
body {
    .v-col-xxl, .v-col-xxl-auto, .v-col-xxl-12, .v-col-xxl-11, .v-col-xxl-10, .v-col-xxl-9, .v-col-xxl-8, .v-col-xxl-7, .v-col-xxl-6, .v-col-xxl-5, .v-col-xxl-4, .v-col-xxl-3, .v-col-xxl-2, .v-col-xxl-1, .v-col-xl, .v-col-xl-auto, .v-col-xl-12, .v-col-xl-11, .v-col-xl-10, .v-col-xl-9, .v-col-xl-8, .v-col-xl-7, .v-col-xl-6, .v-col-xl-5, .v-col-xl-4, .v-col-xl-3, .v-col-xl-2, .v-col-xl-1, .v-col-lg, .v-col-lg-auto, .v-col-lg-12, .v-col-lg-11, .v-col-lg-10, .v-col-lg-9, .v-col-lg-8, .v-col-lg-7, .v-col-lg-6, .v-col-lg-5, .v-col-lg-4, .v-col-lg-3, .v-col-lg-2, .v-col-lg-1, .v-col-md, .v-col-md-auto, .v-col-md-12, .v-col-md-11, .v-col-md-10, .v-col-md-9, .v-col-md-8, .v-col-md-7, .v-col-md-6, .v-col-md-5, .v-col-md-4, .v-col-md-3, .v-col-md-2, .v-col-md-1, .v-col-sm, .v-col-sm-auto, .v-col-sm-12, .v-col-sm-11, .v-col-sm-10, .v-col-sm-9, .v-col-sm-8, .v-col-sm-7, .v-col-sm-6, .v-col-sm-5, .v-col-sm-4, .v-col-sm-3, .v-col-sm-2, .v-col-sm-1, .v-col, .v-col-auto, .v-col-12, .v-col-11, .v-col-10, .v-col-9, .v-col-8, .v-col-7, .v-col-6, .v-col-5, .v-col-4, .v-col-3, .v-col-2, .v-col-1 {
        padding: 0;
    }
}
</style>
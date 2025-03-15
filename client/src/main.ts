/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

const pingSender = new BroadcastChannel("pingSender");
const pingResponder = new BroadcastChannel("pingResponder");
pingSender.onmessage = (event) => {
    console.log("pingSender received message", event.data);
    pingResponder.postMessage("pong");
}

async function countActiveWindows() {
    // send message to all
    let count = 0;
    pingResponder.onmessage = (event) => {
        count++;
    }
    pingSender.postMessage("ping");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("active windows", count);
    return count;
}

countActiveWindows();


import App from './App.vue';
import { createApp } from 'vue'
import { store } from './store'
import { serverMethods } from './lib/serverMethods'
import { addConfig } from './lib/config'
import router from './router/router'
import { setUserData } from './lib/setUserData'

const app = createApp(App)
app.use(router);
addConfig(app);


app.mount('#app');
store.authToken = localStorage.getItem("authToken");
// set cookie if exists
if (store.authToken) {
    document.cookie = `authToken=${store.authToken}`;
}
serverMethods.user.getUser().then(async ({ error, data }) => {
    await router.isReady()
    // if querystring contains invitation-token save it to localstorage
    if (router.currentRoute.value.query["invitation-token"]) {
        localStorage.setItem("invitationToken", router.currentRoute.value.query["invitation-token"]);
    }
    // check if 
    if (error) {
        router.push("/login");
        console.log("error", error);
    } else {
        setUserData(data as any);
        // if invitationToken is set, redirect
        if (localStorage.getItem("invitationToken")) {
            router.push("/accept-invitation");
        } else if (router.currentRoute.value.path === "/" || router.currentRoute.value.path === "/login") {
            router.push("/dashboard");
        }
    }
    store.ready = true;
});

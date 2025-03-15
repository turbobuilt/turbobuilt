<script lang="ts">
import { serverMethods } from "@/lib/serverMethods";
import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";

// load the client library once
let gsiPromise: Promise<any> = null;
function loadGsi() {
    if (gsiPromise) {
        return gsiPromise;
    }
    gsiPromise = new Promise((resolve, reject) => {
        let url = "https://accounts.google.com/gsi/client";
        let script = document.createElement("script");
        script.src = url;
        document.head.appendChild(script);
        script.onload = () => {
            resolve((window as any).google);
            setTimeout(() => {
                resolve((window as any).google);
            }, 1000);
        };
        script.onerror = (e) => {
            reject(e);
        };
    });
    return gsiPromise;
}



declare var google: any;
export default {
    props: ["show"],
    components: {},
    data() {
        return {
            googleUser: null,
            loggingIn: false,
            loginError: ""
        }
    },
    async created() {

    },
    async mounted() {
        let result = await loadGsi();
        console.log("google loaded", result);
        this.initGoogleSignin();
    },
    methods: {
        initGoogleSignin() {
            google.accounts.id.initialize({
                client_id: "167000724153-2hrupk5t75ioetktuspqclfsd8jbbb43.apps.googleusercontent.com",
                callback: this.handleCredentialResponse, // callback function
            });
            google.accounts.id.renderButton(
                document.getElementById("component-google-button"), {
                size: "large",
                'longtitle': true,
                'theme': 'outline',
                width: 300,
            });
        },
        async handleCredentialResponse(response: any) {
            if (this.loggingIn) {
                console.log("quitting bc logging in")
                return;
            }
            this.loggingIn = true;
            let result = await serverMethods.user.loginUserGoogle({ token: response.credential });
            this.loggingIn = false;
            if (checkAndShowHttpError(result)) {
                this.loginError = "Error logging in.  Please try again or contact support";
                return;
            }
            this.$emit("login", result.data);
        },
        goToGoogle() {
            window.open("https://accounts.google.com/signup/v2/webcreateaccount?hl=en&flowName=GlifWebSignIn&flowEntry=SignUp", "_blank");
        }
    }
}
</script>
<template>
    <div class="google-login-button-container" ref="root">
        <div id="component-google-button" ref="realGoogleButton"></div>
        <div class="error" v-if="loginError">{{ loginError }}</div>
    </div>
</template>
<style lang="scss">
.google-login-button-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 100%;
    svg {
        margin-right: 9px;
    }
    #component-google-button {
        // z-index: -1;
        // position: fixed;
        // opacity: 0;
    }
    .google-login-button {
        outline: none;
        box-shadow: 0 0 10px rgba(0, 0, 0, .5);
        border: none;
        color: black;
        // font-weight: bold;
        font-size: 18px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: white;
        width: 100%;
        min-height: 45px;
        border-radius: 5px;
        transition: .1s background-color;
        cursor: pointer;
        &:hover {
            background-color: #f1f1f1;
        }
    }
    .loading {
        text-align: center;
        z-index: -1;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    #google-button {
        font-size: 16px;
    }
    .error {
        padding: 10px;
        color: red;
        background: white;
        border-radius: 5px;
        padding: 5px;
        margin-top: 5px;
    }
    .sign-up-google-button {
        width: 25px;
        border-radius: 5px;
        padding: 5px 8px;
        border: 1px solid gainsboro;
    }
}
</style>
import { resetStore, store } from "@/store";

export function setUserData({ user, authToken, organizationList, userState }) {
    store.user = user;
    store.organizations = organizationList;
    store.userState = userState;
    if (authToken) {
        store.authToken = authToken;
        localStorage.setItem("authToken", authToken);
        // set authToken in cookie same site
        document.cookie = `authToken=${authToken}; path=/; SameSite=Strict`;
    }
}


export function logout() {
    localStorage.removeItem("authToken");
    document.cookie = `authToken=; path=/;`;
    resetStore();
}
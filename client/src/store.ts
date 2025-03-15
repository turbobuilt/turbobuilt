import { reactive } from "vue";
import { User } from "./serverTypes/user/models/User.model";
import { UserState } from "./serverTypes/user/models/UserState.model";
import { ItemPropertyType } from "./serverTypes/itemPropertyType/ItemPropertyType.model";
import { serverMethods } from "./lib/serverMethods";


export const itemPropertyTypesChannel = new BroadcastChannel('itemPropertyTypes');
itemPropertyTypesChannel.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.deleted) {
        store.itemPropertyTypes.delete(data.deleted);
    }
};


export function createStore() {
    return reactive({
        user: null as User,
        authToken: localStorage.getItem("authToken"),
        organizations: [],
        userState: null as UserState,
        ready: false,
        itemPropertyTypes: new Map<string, Promise<ItemPropertyType>>(),
        showMainEditor: false,
        mainEditorCurrentWorkspaceGuid: null,
        vscodeInitialized: false
    });
}

export function resetStore() {
    for (let key in store) {
        delete (store as any)[key];
    }
    Object.assign(store, createStore());
}

export const store = createStore();

export async function saveUserState() {
    await serverMethods.userState.saveUserState(store.userState);
}
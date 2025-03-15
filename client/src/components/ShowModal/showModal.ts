import { addConfig } from "../../lib/config";
import { ComponentPublicInstance, createApp } from "vue";
import ShowModal from "./ShowModal.vue";
import Alert from "./Alert.vue";
import Confirm from "./Confirm.vue";
import Prompt from "./Prompt.vue";

export async function showModal<T>({ component, closable = true, props = {} }: { component: T, closable?: boolean, props?: any }) {
    let result = new Promise((resolve, reject) => {
        let container = document.createElement("div");
        document.body.appendChild(container);
        let app = createApp(ShowModal, {
            onClose: (data) => {
                app._props.showing = false;
                setTimeout(() => {
                    app.unmount();
                    document.body.removeChild(container);
                    resolve(data);
                }, 400);
            },
            closable,
            component,
            props
        });
        addConfig(app);
        app.mount(container);
    });
    return result as any;
}

export async function showAlert(data: { title:string, content:string }|string) {
    let title = typeof data === "string" ? data : data.title;
    let content = typeof data === "string" ? "" : data.content;
    return showModal({ component: Alert, props: { title, content } });
}

export async function showConfirm({ title, content, confirmText }: {title: string, content: string, confirmText?: string}) {
    return showModal({ component: Confirm, props: { title, content, confirmText }, closable: false});
}

export async function showPrompt({ title, content }) {
    return showModal({ component: Prompt, props: { title, content }, closable: false});
}
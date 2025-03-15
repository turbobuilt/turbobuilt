<script lang="ts" setup>
import { compileSfc } from '@/lib/compiler/compile';
import { compileTemplate, compileScript, parse } from '@vue/compiler-sfc';
import { computed, createApp, h, reactive, ref, watch } from 'vue';
import * as Vue from "vue";
import tools from "../../../server/src/common/tools";
import PaypalCheckout from '@/pages/workspace/clientComponents/PaypalCheckout.vue';
window.Vue = Vue;

const props = defineProps<{
    workspaceGuid?: string;
    sfc?: string & { js?: string, css?: string };
    workspaceFilePath?: string;
    modelValue?: any,

}>();
const emit = defineEmits(["compile", "update:modelValue"]);
const d = reactive({
    data: null,
    style: null,
})

const mountElement = ref<HTMLElement>(null)

var app: Vue.App<Element>;
var debounceTimeout = null;
var lastUpdate = Date.now();
Vue.onMounted(() => {
    watch(() => props.sfc, async () => {
        if (debounceTimeout)
            return;
        if (typeof props.sfc === "object") {
            renderSfc();
            return;
        }
        if (Date.now() - lastUpdate < 1000) {
            debounceTimeout = setTimeout(renderSfc, 1000);
            return;
        }
        renderSfc();
    }, { immediate: true });

})

async function renderSfc() {
    debounceTimeout = null;
    lastUpdate = Date.now();
    try {
        if (!props.sfc) {
            if (app) {
                try {
                    app.unmount();
                    app = null;
                } catch (err) {
                    console.error("error unmounting", err)
                }
            }
        }
        (window as any).turbobuiltTools = tools;
        let compiled = props.sfc;
        if(typeof props.sfc === "string") {
            let data = await compileSfc(props.sfc, props.workspaceFilePath, { varName: "fullComponent" });
            let text = JSON.parse(new TextDecoder().decode(data.compiled));
            compiled = text;
        }
        d.style = compiled.css;

        const blob = new Blob([compiled.js + "\nexport default fullComponent"], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        let mod = await import(url)
        if (app) {
            app.unmount();
        }
        app = createApp({
            render: () => h(mod.default, {
                modelValue: props.modelValue,
                'onUpdate:modelValue': (value) => {
                    emit("update:modelValue", value);
                }
            })
        });
        app.component("PaypalCheckout", PaypalCheckout);
        app.mount(mountElement.value);
        emit("compile", { js: compiled.js, css: compiled.css });
    } catch (err) {
        console.error(err);
        mountElement.value.innerHTML = `<p style="color: red; padding: 10px; margin: 0;">${err}</p>`;
    }
}
</script>
<template>
    <div ref="mountElement" class="render-sfc"></div>
    <component is="style" v-html="d.style"></component>
</template>
<style lang="scss">
.render-sfc {}
</style>
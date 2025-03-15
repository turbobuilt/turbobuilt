<script lang="ts" setup>
import { compileSfc } from '@/lib/compiler/compile';
import { compileTemplate, compileScript, parse } from '@vue/compiler-sfc';
import { computed, createApp, h, reactive, ref, watch, defineComponent } from 'vue';
import * as Vue from "vue";
import vueUrl from "vue/dist/vue.esm-bundler.js?url";
import tools from "../../../server/src/common/tools";
import PaypalCheckout from '@/pages/workspace/clientComponents/PaypalCheckout.vue';
import esbuild from "esbuild";


const props = defineProps<{
    sfc: string
    modelValue?: any
}>();
const emit = defineEmits(["compile", "update:modelValue"]);
const d = reactive({
    data: null,
    style: null,
})

const mountElement = ref<HTMLElement>(null)

function fixVueImport(src) {
    return src.replace(/from ['"]vue['"]/g, `from "${window.location.origin}${vueUrl}"`);
}

function fixImports(data) {
    let regex: RegExp;

    regex = /import\s+(.+)\s+from\s+['"]vue['"]/g;
    data = data.replace(regex, function (val, $1) {
        return `const ${$1.replace(/\s+as\s+/g, ":")} = Vue`;
    });

    regex = /import\s+(.+)\s+from\s+['"]@turbobuilt\/tools['"]/;
    data = data.replace(regex, function (val, $1) {
        return `const ${$1} = window.turbobuiltTools;`;
    });
    data = fixVueImport(data);


    return data;
}

var app: Vue.App<Element>;
Vue.onMounted(() => {
    watch(() => props.sfc, async () => {
        try {
            if (!props.sfc) {
                if (app) {
                    app.unmount();
                    app = null;
                }
            }
            (window as any).turbobuiltTools = tools;
            const sfc = fixImports(props.sfc);

            let extra = `
                let window = mountElement.value.ownerDocument.defaultView,
                let document = mountElement.value.ownerDocument
            `

            // console.log("will compile");
            // let data = await compileAndRenderSFC(sfc);
            // d.style = data.style;
            // console.log("rende rcode", data.renderFunction.code)
            // let makeRenderFn = new Function(data.renderFunction.code);
            // let componentCode = fixVueImport(data.componentCode)
            // console.log("Component code", componentCode)

            // let all = componentCode;
            // console.log("Descriptor", data.descriptor);

            // if (data.descriptor.script) {
            //     all = componentCode.trim().slice(0, -1).trim() + ",\n\trender:(" + makeRenderFn.toString() + ")()\n}";
            // }
            // console.log("all is", all)



            // let mod = await import(url)

            const parsed = parse(sfc);
            const script = compileScript(parsed.descriptor, { id: 'example', inlineTemplate: !!parsed.descriptor.scriptSetup });
            const template = compileTemplate({
                source: parsed.descriptor.template.content,
                filename: 'example.vue',
                id: 'example',
            });
            // let componentCode = `//RENDER\n\n${template.code}\n\n\n\n//COMPONENT\n\n${script.content}`;
            let componentCode = script.content;

            componentCode = fixImports(componentCode);
            console.log("Component is ", componentCode)
            // const componentData = new Function('Vue', componentCode)(require("vue"));
            // const component = vue.defineComponent(componentData);
//             var txt = `
// import { toDisplayString as _toDisplayString, vModelText as _vModelText, createElementVNode as _createElementVNode, withDirectives as _withDirectives, createCommentVNode as _createCommentVNode, createTextVNode as _createTextVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "https://smarthost.co:8008/node_modules/vue/dist/vue.esm-bundler.js"

// const _hoisted_1 = { class: "component-name" }

// import { reactive } from "https://smarthost.co:8008/node_modules/vue/dist/vue.esm-bundler.js";

// export default {
//   setup(__props, { expose: __expose }) {
//     __expose();

//     const { getUpload, registerUploads } = window.turbobuiltTools;;

//     const d = { name: "bob" }


//     console.log("RUNNING SETUP")
//     return { d}
//     const __returned__ = { getUpload, registerUploads, d, get reactive() { return reactive } }
//     Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true })
//     console.log("returned i", __returned__)
//     return __returned__
//   },
//   render(_ctx, _cache) {
//     console.log("Ctx is", _ctx)
//     return (_openBlock(), _createElementBlock("div", _hoisted_1, [
//       _createTextVNode(" TESTS " + _toDisplayString(_ctx.d) + " ", 1 /* TEXT */),
//       _withDirectives(_createElementVNode("input", {
//         "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.d.name) = $event))
//       }, null, 512 /* NEED_PATCH */), [
//         [_vModelText, _ctx.d.name]
//       ]),
//       _createCommentVNode(" <img src=\\"getUpload({ id: 'main-image', index: 0}).url\\" /> ")
//     ]))
//   }
// }            
//             `;
            const blob = new Blob([componentCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);

            let importData = await import(url)
            // const _hoisted_1 = { class: "component-name" }
            // // console.log
            // function render(_ctx, _cache) {
            //     return (_openBlock(), _createElementBlock("div", _hoisted_1, [
            //         _createTextVNode(" TESTS " + _toDisplayString(_ctx.d) + " ", 1 /* TEXT */),
            //         _withDirectives(_createElementVNode("input", {
            //             "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.d.name) = $event))
            //         }, null, 512 /* NEED_PATCH */), [
            //             [_vModelText, _ctx.d.name]
            //         ]),
            //         _createCommentVNode(" <img src=\"getUpload({ id: 'main-image', index: 0}).url\" /> ")
            //     ]))
            // }
            // console.log("import data", importData)
            // importData.default.render = importData.render; //.bind(importData.default)

            // let componentData = {
            //     // ...importData.default,
            //     setup() {
            //         return { d: { name: "bob" } }
            //     },
            //     render
            //     // render: new Function(`return ${importData.render.toString()}`)()
            //     // render: importData.render
            // }
            // console.log("Compoennt data", componentData)
            // const component = vue.defineComponent(componentData);

            // console.log("Component is ", component)

            if (app) {
                app.unmount();
            }

            // @ts-ignore
            // with ({
            //     window: mountElement.value.ownerDocument.defaultView,
            //     document: mountElement.value.ownerDocument
            // }) {
            let appData = {
                ...importData.default,
                // setup() {
                //     const returned = { d: Vue.reactive({ name: "bob "}) };
                //     Object.defineProperty(returned, '__isScriptSetup', { enumerable: false, value: true })
                //     return returned;
                // },
                // render: importData.render
            };
            console.log("appData", appData);
            app = Vue.createApp(appData);
            // app = createApp({

            //     // render: () => h(mod.default, {
            //     //     modelValue: props.modelValue,
            //     //     'onUpdate:modelValue': (value) => {
            //     //         emit("update:modelValue", value);
            //     //     }
            //     // })
            // });
            app.component("PaypalCheckout", PaypalCheckout);
            app.mount(mountElement.value);

            // emit("compile", { js: all, css: data.style });
            // }
        } catch (err) {
            console.error(err);
            mountElement.value.innerHTML = `<p style="color: red; padding: 10px; margin: 0;">${err}</p>        
            `;
        }
    }, { immediate: true });

})

</script>
<template>
    <div class="render-sfc">
        <div ref="mountElement"></div>
        <component is="style" v-html="d.style"></component>
    </div>
</template>
<style lang="scss">
.render-sfc {}
</style>
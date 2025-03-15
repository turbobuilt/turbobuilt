<script lang="ts" setup>
import 'monaco-editor-core'
import 'monaco-volar'
import * as onigasm from "onigasm";
import onigasmWasm from "onigasm/lib/onigasm.wasm?url";
import editorWorker from "monaco-editor-core/esm/vs/editor/editor.worker?worker";
import vueWorker from "monaco-volar/vue.worker?worker";
import { ref, watch } from 'vue';
import { editor } from "monaco-editor-core";
import { loadGrammars, loadTheme } from "monaco-volar";
import * as monaco from "monaco-editor-core";
import { onMounted } from 'vue';

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

function loadOnigasm() {
    if (window["onigasmLoaded"]) {
        return;
    }
    window["onigasmLoaded"] = true;
    return onigasm.loadWASM(onigasmWasm);
}

loadOnigasm()
const editorElement = ref<HTMLElement | null>(null)

let model: editor.ITextModel;
onMounted(async () => {
    const theme = await loadTheme(editor);
    console.log("editor element", editorElement.value);

    model = editor.createModel(props.modelValue, 'vue');
    const editorInstance = editor.create(editorElement.value as HTMLElement, {
        theme: theme.dark,
        model,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        minimap: {
            enabled: false,
        },
        inlineSuggest: {
            enabled: false,
        },
        "semanticHighlighting.enabled": true,
        /* other options*/
    })

    loadGrammars(monaco, editorInstance);


    function loadMonacoEnv() {
        (self as any).MonacoEnvironment = {
            async getWorker(_: any, label: string) {
                if (label === "vue") {
                    return new vueWorker();
                }
                return new editorWorker();
            },
        };
    }

    loadMonacoEnv()

    // on edit, emit 
    editorInstance.onDidChangeModelContent(() => {
        let value = model.getValue();
        if (props["modelValue"] !== value) {
            emit("update:modelValue", value);
        }
    });

    console.log('mounted monaco vue');
})

watch(() => props.modelValue, (newVal, oldVal) => {
    if (model && model.getValue() !== newVal) {
        model.setValue(newVal);
    }
})
</script>
<template>
    <div class="monaco-vue">
        <div ref="editorElement"></div>
    </div>
</template>
<style lang="scss">
.monaco-vue {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    > div {
        flex-grow: 1;
    }
}
</style>
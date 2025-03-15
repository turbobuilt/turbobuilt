import { setupMonacoEnv, loadOnigasm } from "./env";
import * as monaco from "monaco-editor-core";
import { loadGrammars, loadTheme } from "../src/index";
import { getOrCreateModel } from "../src/utils";
import data from "./Test.vue?raw";

const afterReady = (theme: string) => {
    const model = getOrCreateModel(
        monaco.Uri.parse("file:///demo.vue"),
        "vue",
        data
    );
    const element = document.getElementById("app")!;
    const editorInstance = monaco.editor.create(element, {
        theme,
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
    });

    // Support for semantic highlighting
    const t = (editorInstance as any)._themeService._theme;
    t.getTokenStyleMetadata = (
        type: string,
        modifiers: string[],
        _language: string
    ) => {
        const _readonly = modifiers.includes("readonly");
        switch (type) {
            case "function":
            case "method":
                return { foreground: 12 };
            case "class":
                return { foreground: 11 };
            case "variable":
            case "property":
                return { foreground: _readonly ? 21 : 9 };
            default:
                return { foreground: 0 };
        }
    };

    loadGrammars(monaco, editorInstance);
};

Promise.all([setupMonacoEnv(), loadOnigasm(), loadTheme(monaco.editor)]).then(
    ([, , theme]) => {
        afterReady(theme.dark);
    }
);
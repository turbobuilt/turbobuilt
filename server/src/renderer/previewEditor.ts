import { readFile } from "fs/promises";
import editorGuiJson from "./editorGuiCompiled/EditorGui.json";

export async function renderPreviewEditor() {
    let content = 
    `
    <style>
    ${editorGuiJson.css}
    </style>
    <script type="module">
    (function() {
        let editorGui = document.createElement("div");
        editorGui.id = "editorGui";
        document.body.appendChild(editorGui);
        var { createApp } = Vue;
        ${editorGuiJson.js};
        createApp(fullComponent).mount("#editorGui");
    })();
    </script>
    `;
    return content;
}
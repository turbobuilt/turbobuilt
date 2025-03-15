// import { serverMethods } from "@/lib/serverMethods";
// import { compileSfc } from "./compile";

// import FileInput from './client-components/FileInput.vue?raw';
// let importRegex = /import\s+(.+?)\s+from\s+['"](.+?)['"]/g;


// const clientComponents = {
//     FileInput
// };

// export async function resolveImports(workspaceGuid: string, code: string) {
//     let matches = Array.from(code.matchAll(importRegex));
//     let transformedCode = code;

//     let results = await Promise.all(matches.map(async match => {
//         let [fullMatch, componentName, componentPath] = match;
//         if (componentPath === "vue")
//             return null;
//         let { js, css } = await loadComponent(workspaceGuid, componentPath);
//         return { fullMatch, js: js || '', css: css || '', componentName, componentPath };
//     }))
//     results = results.filter(item => item);
//     if (!results.length) {
//         // console.log("no children for code")
//         return { js: code || '', styles: "" }
//     } else {
//         // console.log("has children")
//     }

//     let styles = [];
//     let keys = [];
//     console.log("default is", transformedCode)
//     for (let result of results) {
//         transformedCode = transformedCode.replace(result.fullMatch, `let ${result.componentName} = loadComponentTurbobuilt("${result.componentPath}");`);
//         keys.push(`"${result.componentPath}":${result.js}`);
//         styles.push(result.css || "");
//     }

//     // console.log("keys are", keys);
//     transformedCode = `\n
//     const importedModulesTurbobuilt = {
//         ${keys.join(",\n")}
//     };
//     function loadComponentTurbobuilt(importPath) {
//         return importedModulesTurbobuilt[importPath];
//     }\n\n` + transformedCode
//     console.log("styles", styles)
//     return { js: transformedCode, css: styles.join("\n") };
// }

// // Example loader function
// async function loadComponent(workspaceGuid: string, path) {
//     if (path == "vue")
//         return;
//     console.log('laoding', path)
//     if (path.startsWith(".")) {
//         let result = await serverMethods.workspaceFile.getWorkspaceFileByPath(workspaceGuid, path);
//         if (result.error) {
//             throw result.error;
//         }
//         let data = await compileSfc(workspaceGuid, result.data.content, { varName: "fullComponent" });
//         return { js: `(function(){${data.js};\nreturn fullComponent;})()`, css: data.css }
//     } else if (path.endsWith(".vue") && clientComponents[path.slice(0, -4)]) {
//         console.log("loading vue component", path)
//         let data = await compileSfc(workspaceGuid, clientComponents[path.slice(0, -4)], { varName: "fullComponent" });
//         return { js: `(function(){${data.js};\nreturn fullComponent;})()`, css: data.css }
//     } else {
//         throw new Error("Cannot find import " + path)
//     }
// }


// function getTest() {
//     return `<script>
// import { defineComponent } from "vue";
// import tools from "@turbobuilt/tools"

// export default {
//     data() {
//         return { 
//             d: {name: "bob"}
//         }
//     },
// }
// </script>
// <template>
//     <div class="item-page">
//     TEST SUBCOMPONEt!!! {{ d.name }}
//     <input v-model="d.name" />
//     </div>
// </template>
// <style lang="scss">
// .item-page {

// }
// </style>`;
// }
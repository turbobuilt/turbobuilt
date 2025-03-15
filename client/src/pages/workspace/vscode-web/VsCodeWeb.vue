<script lang="ts" setup>
console.log("Testinginin")
import "vscode-web/dist/out/vs/workbench/workbench.web.main.css";
import * as test from "vscode-web/dist/out/vs/loader.js";
import "vscode-web/dist/out/vs/webPackagePaths.js";

console.log("Test is ", test)
for (let key in test) {
    console.log("key is", key, "value is", test[key]);
    window[key] = test[key];
}

let webPackagePaths = {
    "@microsoft/1ds-core-js": "dist/ms.core.min.js",
    "@microsoft/1ds-post-js": "dist/ms.post.min.js",
    "@vscode/iconv-lite-umd": "lib/iconv-lite-umd.js",
    "@vscode/vscode-languagedetection": "dist/lib/index.js",
    "@xterm/addon-clipboard": "lib/addon-clipboard.js",
    "@xterm/addon-image": "lib/addon-image.js",
    "@xterm/addon-search": "lib/addon-search.js",
    "@xterm/addon-serialize": "lib/addon-serialize.js",
    "@xterm/addon-unicode11": "lib/addon-unicode11.js",
    "@xterm/addon-webgl": "lib/addon-webgl.js",
    "@xterm/xterm": "lib/xterm.js",
    "jschardet": "dist/jschardet.min.js",
    "tas-client-umd": "lib/tas-client-umd.js",
    "vscode-oniguruma": "release/main.js",
    "vscode-textmate": "release/main.js",
    "@microsoft/dynamicproto-js": "lib/dist/umd/dynamicproto-js.min.js",
    "@microsoft/applicationinsights-shims": "dist/umd/applicationinsights-shims.min.js",
    "@microsoft/applicationinsights-core-js": "browser/applicationinsights-core-js.min.js"
}
import * as core from "vscode-web/dist/node_modules/@microsoft/1ds-core-js/dist/ms.core.min.js";
console.log("Core is", core)

async function main() {
    for(let key in webPackagePaths) {
        let result = await import(`vscode-web/dist/node_modules/${key}/${webPackagePaths[key]}`);
    }
    Object.keys(webPackagePaths).map(function (key, index) {
      webPackagePaths[
        key
      ] = `${window.location.origin}/node_modules/vscode-web/dist/node_modules/${key}/${webPackagePaths[key]}`;
    });
    // require.config({
    //   baseUrl: `${window.location.origin}/node_modules/vscode-web/dist/out`,
    //   recordStats: true,
    //   trustedTypesPolicy: window.trustedTypes?.createPolicy('amdLoader', {
    //     createScriptURL(value) {
    //       return value;
    //     },
    //   }),
    //   paths: webPackagePaths,
    // });

    // let results = await Promise.all([
    //     import("vscode-web/dist/out/vs/workbench/workbench.web.main.nls.js"),
    //     import("vscode-web/dist/out/vs/workbench/workbench.web.main.js"),
    //     import("vscode-web/dist/out/vs/code/browser/workbench/workbench.js")
    // ])
    // console.log("results", results);
    // import "vscode-web/dist/out/vs/workbench/workbench.web.main.nls.js";
    // import "vscode-web/dist/out/vs/workbench/workbench.web.main.js";
    // import "vscode-web/dist/out/vs/code/browser/workbench/workbench.js";
}
main();



// console.log("self.webPackagePaths", self.webPackagePaths, "define is", self.define);

// import all these
// import "vscode-web/dist/node_modules/@microsoft/1ds-core-js/dist/ms.core.min.js";


// Object.keys(self.webPackagePaths).map(function (key, index) {
//     self.webPackagePaths[
//         key
//     ] = `${window.location.origin}/node_modules/vscode-web/dist/node_modules/${key}/${self.webPackagePaths[key]}`;
// });
// require.config({
//     baseUrl: `${window.location.origin}/node_modules/vscode-web/dist/out`,
//     recordStats: true,
//     trustedTypesPolicy: window.trustedTypes?.createPolicy('amdLoader', {
//         createScriptURL(value) {
//             return value;
//         },
//     }),
//     paths: self.webPackagePaths,
// });

</script>
<template>
    <div class="vs-code-web">
        vs code web
    </div>
</template>
<style lang="scss">
.vs-code-web {}
</style>
// import { createApp, h, render } from 'vue';
// import * as compiler from "@vue/compiler-sfc";
// import * as sass from 'sass';
// import * as Vue from "vue";
// import { serverMethods } from '@/lib/serverMethods';
// import PaypalCheckout from '../workspace/clientComponents/PaypalCheckout.vue';
// (window as any).Vue = Vue;
// const imgRegex = /\[\s*img\s+(.+?)\s*\]/g;
// import vueUrl from "vue/dist/vue.esm-browser.js?url";
// import esbuild from "esbuild-wasm";
// import { resolveImports } from './resolveImports';

// esbuild.initialize({
//     wasmURL: './node_modules/esbuild-wasm/esbuild.wasm',
// })
// function fixVueImport(src) {
//     return src.replace(/from ['"]vue['"]/g, `from "${window.location.origin}${vueUrl}"`);
// }


// function fixImports(data) {
//     let regex: RegExp;


//     regex = /import\s+(.+?)\s+from\s+['"]vue['"]/g;
//     data = data.replace(regex, function (val, $1) {
//         return `const ${$1.replace(/\s+as\s+/g, ":")} = Vue`;
//     });

//     regex = /import\s+(.+?)\s+from\s+['"]@turbobuilt\/tools['"]/;
//     data = data.replace(regex, function (val, $1) {
//         return `const ${$1} = window.turbobuiltTools;`;
//     });
//     data = fixVueImport(data);

//     return data;
// }

// export async function compileSfc(workspaceGuid, sfcCode, options?: { varName: string }) {
//     console.log("compiling sfc", sfcCode);
//     let regex = /import\s+(.+?)\s+from\s+['"]@turbobuilt\/tools['"]/;
//     sfcCode = sfcCode.replace(regex, function (val, $1) {
//         return `const ${$1} = window.turbobuiltTools;`;
//     });

//     let extra = `
//         let window = mountElement.value.ownerDocument.defaultView,
//         let document = mountElement.value.ownerDocument
//     `;

//     let matches = Array.from(sfcCode.matchAll(imgRegex));
//     let imageObjectIds = new Set<string>();
//     for (let match of matches) {
//         imageObjectIds.add(match[1]);
//     }
//     if (imageObjectIds.size > 0) {
//         let imagesResult = await serverMethods.upload.getUploadUrlListByObjectId(Array.from(imageObjectIds));
//         // console.log(imagesResult)
//         sfcCode = sfcCode.replace(imgRegex, (val, $1) => {
//             if (!imagesResult.data?.items?.[$1]) {
//                 return `image-id-not-found`
//             }
//             return "https://clientsites.dreamgenerator.ai/" + imagesResult.data.items?.[$1][0].url
//         });
//     }
//     const { descriptor } = compiler.parse(sfcCode);
//     let styleInfo = descriptor.styles?.[0];
//     // console.log("sfc code", sfcCode)

//     let style = "";
//     if (styleInfo) {
//         style = styleInfo?.content?.trim() || "";
//         if (styleInfo.lang === "scss") {
//             style = (await sass.compileStringAsync(style, {
//                 importers: [{
//                     canonicalize(url) {
//                         return new URL(url, "file://");
//                     },
//                     async load(url) {
//                         // console.log("Getting sass file", url);
//                         let result = await serverMethods.workspaceFile.getWorkspaceFileByPath(workspaceGuid, url.pathname);
//                         if (result.error) {
//                             throw result.error;
//                         }
//                         return {
//                             contents: result.data.content,
//                             syntax: 'scss'
//                         }
//                     },
//                 }]
//             })).css.toString() || "";
//         }
//     }

//     const renderFunction = compiler.compileTemplate({
//         id: 'sfc',
//         source: descriptor.template.content,
//         filename: 'sfc.vue',
//         compilerOptions: {
//             mode: 'function',
//             prefixIdentifiers: true
//         }
//     });

//     const script = compiler.compileScript(descriptor, { id: 'sfc', inlineTemplate: !!descriptor.scriptSetup, genDefaultAs: options?.varName });
//     let componentCode = script.content;

//     let makeRenderFn = new Function(renderFunction.code);
//     let { js, css } = await resolveImports(workspaceGuid, componentCode);
//     componentCode = js;
//     console.log("css is", css);
//     style += "\n" + (css || "");
//     componentCode = fixImports(componentCode)
//     // esbuild.initialize({ })
//     // let all = (await esbuild.transform(componentCode)).code;

//     let all = componentCode;

//     if (!descriptor.scriptSetup) {
//         all = componentCode.trim().slice(0, -1).trim();
//         if (all.at(-1) !== ",")
//             all += ","
//         all += "\n\trender:(" + makeRenderFn.toString() + ")()\n}";
//     }
//     // console.log("all", all)
//     return { js: all, css: style };
// }
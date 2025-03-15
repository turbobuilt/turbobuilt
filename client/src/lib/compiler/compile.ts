import * as compiler from "@vue/compiler-sfc";
import * as sass from 'sass';
import { serverMethods } from '../../lib/serverMethods';
const imgRegex = /\[\s*img\s+(.+?)\s*\]/g;
import esbuildWasm from "esbuild-wasm";
import { resolveImports } from './resolveImports';
import esbuildWasmUrl from 'esbuild-wasm/esbuild.wasm?url';
import { FileSystem } from '../fileSystem/FileSystem';

var esBuildLoaderPromise = null;

const vueUrl = "/vue/vue.global.min.js";

async function loadEsBuildWasm() {
    try {
        if (!esBuildLoaderPromise)
            if (typeof window !== "undefined")
                esBuildLoaderPromise = esbuildWasm.initialize({
                    worker: true,
                    wasmURL: window.location.href.indexOf("portal.turbobuilt.com") ? "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.24.0/esbuild.wasm" : esbuildWasmUrl
                });
            else {
                
            }
    } catch (err) {
        console.error(err);
        esBuildLoaderPromise = new Promise(r => r(null));
    }
    await esBuildLoaderPromise;
    return esbuildWasm
}
loadEsBuildWasm();
export function getEsbuild() : Promise<typeof esbuildWasm|typeof import("../../../node_modules/esbuild/lib/main")> {
    return new Promise(async resolve => {
        if (typeof window !== "undefined") {
            await loadEsBuildWasm();
            resolve(esbuildWasm);
        } else {
            let esbuild = await import("esbuild");
            resolve(esbuild);
        }
    });
}

function fixVueImport(src) {
    let origin = typeof window !== "undefined" ? window.location.origin : "NULL_ORIGIN";
    return src.replace(/from ['"]vue['"]/g, `from "${origin}${vueUrl}"`);
}

function fixImports(data) {
    let regex: RegExp;

    regex = /import\s+(.+?)\s+from\s+['"]vue['"]/g;
    data = data.replace(regex, function (val, $1) {
        return `const ${$1.replace(/\s+as\s+/g, ":")} = Vue`;
    });

    regex = /import\s+(.+?)\s+from\s+['"]@turbobuilt\/tools['"]/;
    data = data.replace(regex, function (val, $1) {
        return `const ${$1} = window.turbobuiltTools;`;
    });
    data = fixVueImport(data);


    return data;
}

export async function compileSfc(sfcCode, path, options?: { varName?: string, replaceImages?: boolean }) {
    try {
        let workspaceGuid = path.split("/")[0];
        let dependencies = new Set<string>();
        let regex = /import\s+(.+?)\s+from\s+['"]@turbobuilt\/tools['"]/;
        sfcCode = sfcCode.replace(regex, function (val, $1) {
            return `const ${$1} = Object.assign({ workspaceGuid: '${workspaceGuid}', filePath: ${JSON.stringify({ path: path || "" })}.path},  window.turbobuiltTools);
            // ${$1}.callMethod = ${$1}.callMethod.bind()
            `;
        });

        let extra = `
            let window = mountElement.value.ownerDocument.defaultView,
            let document = mountElement.value.ownerDocument
        `;

        let matches = Array.from(sfcCode.matchAll(imgRegex));
        let imageObjectIds = new Set<string>();
        for (let match of matches) {
            imageObjectIds.add(match[1]);
        }
        // if (imageObjectIds.size > 0) {
        //     let imagesResult = await serverMethods.upload.getUploadUrlListByObjectId(Array.from(imageObjectIds));
        //     console.log("images result", imagesResult.data, "images", imageObjectIds);
        //     sfcCode = sfcCode.replace(imgRegex, (val, $1) => {
        //         if (!imagesResult.data?.items?.[$1]) {
        //             return `image-id-not-found`
        //         }
        //         return "https://clientsites.dreamgenerator.ai/" + imagesResult.data.items?.[$1][0].url
        //     });
        // }
        const { descriptor } = compiler.parse(sfcCode, { filename: path || "sfc.vue" });
        let styleInfo = descriptor.styles?.[0];

        let style = "";
        if (styleInfo) {
            style = styleInfo?.content?.trim() || "";
            if (styleInfo.lang === "scss") {
                style = await compileSass(style, path || "/");
            }
        }
        let renderFunction
        try {
            renderFunction = compiler.compileTemplate({
                id: 'sfc',
                source: descriptor.template.content,
                filename: 'sfc.vue',
                compilerOptions: {
                    mode: 'function',
                    prefixIdentifiers: true
                }
            });
        } catch (err) {
            console.error(err);
            console.log("descriptor is", descriptor);
            console.log("path is", path)
            console.log("sfcCode is", sfcCode)
            throw err;
        }
        let makeRenderFn = new Function(renderFunction.code);
        
        let all = ""
        if (descriptor.scriptSetup || descriptor.script) {
            const script = compiler.compileScript(descriptor, { id: 'sfc', inlineTemplate: !!descriptor.scriptSetup, genDefaultAs: options?.varName });
            let componentCode = script.content;
            componentCode = fixImports(componentCode)

            // 
            let esbuild = await getEsbuild();

            if (script.lang === "ts" || script.lang === "typescript") {
                try {
                    componentCode = (await esbuild.transform(componentCode, { loader: "ts" })).code;
                } catch (err) {
                    console.error(componentCode)
                    throw new Error(`Error transforming ${path}: ${err.message}`)
                }
            }
            componentCode = (await esbuild.transform(componentCode, { loader: "ts" })).code;

            if (!descriptor.scriptSetup) {
                componentCode = componentCode.replace(/export\s+default\s+/, "const fullComponent = ")
                componentCode += "\n\nfullComponent.render = (" + makeRenderFn.toString() + ")()";
            }

            let importsResult = await resolveImports(componentCode, path);
            let { js, css } = importsResult;
            for (let dep of importsResult.dependencies) dependencies.add(dep);
            componentCode = js;
            style += "\n" + (css || "");
            all = componentCode;
        } else {
            all = `const fullComponent = {};
            fullComponent.render = (${makeRenderFn.toString()})()`;
        }

        let result = new TextEncoder().encode(JSON.stringify({ js: all, css: style }));
        return { compiled: result, dependencies };
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err.stack))
        console.log("The message is", err.message)
        let result = new TextEncoder().encode(JSON.stringify({ error: JSON.stringify(err.message + "\n\n" + err.stack) }));
        return { compiled: result, dependencies: [] };
    }
}

async function compileSass(contents, currentFilePath) {
    const result = await sass.compileStringAsync(contents, {
        importers: [{
            async canonicalize(url, options) {
                let resolvedPath = ""
                if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith('/'))
                    resolvedPath = new URL(url, `file://${currentFilePath}`).pathname;
                else
                    resolvedPath = `${url}`;
                console.log("Current file path", currentFilePath, "Resolved path", resolvedPath, "requested url", url);
                return new URL(`file://${resolvedPath}`);
            },
            async load(fileUrl) {
                console.log("requesting sass file", fileUrl);
                try {
                    // Read the file content asynchronously
                    const filePath = "/" + fileUrl.href.replace(/^file:\/\/\/?/, "");
                    let content = "";
                    let result = await FileSystem.getFile(filePath);
                    content = new TextDecoder().decode(result.content);
                    console.log("Loaded file", filePath, "result is", result);
                    if (result?.exists === false) {
                        throw new Error(`File not found: ${fileUrl}`);
                    }
                    return { contents: content, syntax: filePath.split(".").at(-1) as "scss" | "css" };
                } catch (error) {
                    console.error(`Failed to load file: ${fileUrl}`, error);
                    return null;
                }
            }
        }]
    });

    return result.css.toString() || '';
}

export async function compile({ content, path }){
    console.log("compiling", path);
    if (path.endsWith(".vue")) {
        return compileSfc(content, path);
    } else if (path.endsWith('.ts')) {
        let esbuild = await getEsbuild();
        let result = await esbuild.transform(content, { loader: "ts" });
        return { compiled: result.code, dependencies: [] };
    }
}
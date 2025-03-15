import { serverMethods } from "@/lib/serverMethods";
import { compile, compileSfc, getEsbuild } from "./compile";
import { FileSystem } from "../fileSystem/FileSystem";

let importRegex = /import\s+(.+?)\s+from\s+['"](.+?)['"]/gs;

export async function resolveImports(code: string, path: string) {
    let matches = Array.from(code.matchAll(importRegex));
    let transformedCode = code;
    let dependencies = new Set<string>();
    let results = await Promise.all(matches.map(async match => {
        let [fullMatch, importSpecifier, componentPath] = match;
        if (componentPath.startsWith('http://') || componentPath.startsWith('https://'))
            return;
        let result = await loadComponent(componentPath, path, importSpecifier, fullMatch);
        let { js, css } = result;
        for (let dep of result.dependencies) dependencies.add(new URL(dep, `file://${path}`).pathname);
        return { fullMatch, js, css: css, componentName: importSpecifier, componentPath };
    }));
    results = results.filter(item => item);
    if (!results.length) {
        return { js: code, styles: "", dependencies };
    } else {
        // console.log("has children")
    }
    let styles = [];
    let keys = [];
    for (let result of results) {
        transformedCode = transformedCode.replace(result.fullMatch, `let ${result.componentName} = loadComponentTurbobuilt("${result.componentPath}");`);
        keys.push(`"${result.componentPath}":${result.js}`);
        styles.push(result.css);
        dependencies.add(new URL(result.componentPath, `file://${path}`).pathname);
    }

    transformedCode = `\n
    const importedModulesTurbobuilt = {
        ${keys.join(",\n")}
    };
    function loadComponentTurbobuilt(importPath) {
        return importedModulesTurbobuilt[importPath];
    }\n\n` + transformedCode

    return { js: transformedCode, css: styles.join("\n"), dependencies };
}

async function loadComponent(path, parentPath, importSpecifier, fullMatch) {
    console.log("loading coimpoent", path, "parentPath is", parentPath);
    let content = null, compiled = null, dependencies = new Set<string>();
    if (path.startsWith(".")) {
        if (!path.match(/\/.*\..+$/)) {
            path += ".ts";
        }
        if (typeof window === "undefined") {
            // Server-side (Node.js) environment
            const { default: fs } = await import('fs/promises');
            // compute path relative to parent for server side code
            const { default: nodePath } = await import('path');
            const parentDir = nodePath.dirname(parentPath);
            console.log("parent path", parentPath);
            let absolutePath = nodePath.resolve(parentDir, path);
            console.log("looking for", absolutePath);
            let content = await fs.readFile(absolutePath, "utf8");
            if (path.endsWith(".vue")) {
                console.log("COIMPILEING", path);
                let result = await compileSfc(content, absolutePath, { varName: "fullComponent" });
                compiled = result.compiled;
            }
        } else {
            let absolutePath = path;
            if (!absolutePath.startsWith("/"))
                absolutePath = new URL(path, `file://${parentPath}`).pathname;
            console.log("looking for", absolutePath);
            let result = await FileSystem.getFile(absolutePath);
            console.log("Getting file from local", path, result);
            if (result.compiled === undefined) {
                // compile
                result = await compile({ content: new TextDecoder().decode(result.content), path: absolutePath }) as any;
                throw new Error(`imported file "${path}" was not found or was empty.`)
            }
            // content = new TextDecoder().decode(result.data);
            compiled = result.compiled;
        }
    } else {
        const componentName = path.replace(/\.vue$/, "");
        if (typeof window === "undefined") {
            // @ts-ignore
            let fs = await import("fs/promises");
            if (path.endsWith(".vue")) {
                let content = await fs.readFile(`src/lib/compiler/clientComponents/${componentName}.vue`, "utf8");
                console.log("compiling import", path);
                let result = await compileSfc(content, `src/lib/compiler/clientComponents/${componentName}.vue`, { varName: "fullComponent" });
                compiled = result.compiled;
            } else {
                // load from node modules
                let esbuild = await getEsbuild();
                let rawCode = `${fullMatch}
                export ${importSpecifier}`;
                let result = await esbuild.build({
                    stdin: {
                        contents: rawCode,
                        resolveDir: "./", // Set the directory for resolving imports
                        sourcefile: path,
                    },
                    // external: ["@mdi/js"],
                    bundle: true,
                    globalName: "fullComponent",
                    write: false,
                });
                compiled = { js: result.outputFiles[0].text };
            }
        } else {
            const rendered = await import("./clientComponentsCompiled/index");
            const { clientComponentsRendered } = rendered;
            let match = clientComponentsRendered[componentName];
            if (match) {
                content = match;
                if (clientComponentsRendered[componentName]) {
                    compiled = clientComponentsRendered[componentName];
                } else {

                }
            } else {
                console.log("WINDOW UNDEFINED", path);
            }
        }
    }
    if (!content && !compiled) {
        throw new Error(`imported file "${path}" was not found or was empty.`)
    }
    if (path.endsWith(".json")) {
        return { js: `(function(){ return ${compiled}; })()`, css: "" };
    }
    if (!compiled) {
        let result = await compileSfc(content, path, { varName: "fullComponent" });
        compiled = result.compiled;
        for (let dep of result.dependencies) dependencies.add(dep);
    }
    // if compiled is arraybuffer
    if (compiled instanceof Uint8Array) {
        let text = new TextDecoder().decode(compiled);
        compiled = JSON.parse(text);
    }
    return { js: `(function(){${compiled.js};\nreturn fullComponent;})()`, css: compiled.css || '', dependencies }
}
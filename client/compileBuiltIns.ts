import { compileSfc } from "./src/lib/compiler/compile.ts";
import * as fs from "fs/promises";
import { $ } from "bun";
import { rimrafSync } from "rimraf";
import { cpSync } from "fs";

async function compileComponents(componentDir, outDir) {
    const indexPath = `${outDir}/index.ts`;
    const template = `// Default index file
export const clientComponentsRendered = {};
`;
    // ensure otudir exsts
    try { await fs.access(outDir); } catch { await fs.mkdir(outDir, { recursive: true }); }
    // Ensure index.ts exists
    try { await fs.access(indexPath); } catch { await fs.writeFile(indexPath, template); }

    // Read current index
    let indexContent = await fs.readFile(indexPath, "utf-8");
    let imports = indexContent.match(/import\s+(\w+)\s+from\s+"\.\/(\w+)\.json"/g) || [];
    let exportsMatch = indexContent.match(/export\s+const\s+clientComponentsRendered\s*=\s*\{([\s\S]*?)\}/);
    let exportsBlock = exportsMatch ? exportsMatch[1] : "";

    // Map existing components
    let existingNames = imports.map(i => i.match(/import\s+(\w+)\s+from\s+"\.\/(\w+)\.json"/)![1]);
    let clientComponents = await fs.readdir(componentDir);
    let builtNames = (await fs.readdir(outDir))
        .filter(f => f.endsWith(".json"))
        .map(f => f.replace(".json", ""));

    // Remove old items
    for (let oldItem of builtNames) {
        if (!clientComponents.map(f => f.replace(".vue", "")).includes(oldItem)) {
            indexContent = indexContent.replace(new RegExp(`import\\s+${oldItem}\\s+from\\s+"\\.\\/${oldItem}\\.json"\\n?`), "");
            indexContent = indexContent.replace(new RegExp(`\\s*${oldItem},?`), "");
            await fs.unlink(`${outDir}/${oldItem}.json`);
        }
    }

    // Add new items
    for (let file of clientComponents) {
        let name = file.replace(".vue", "");
        if (!existingNames.includes(name)) {
            indexContent = `import ${name} from "./${name}.json"\n` + indexContent;
            let pos = indexContent.indexOf("export const clientComponentsRendered");
            if (pos > -1) {
                let insertPos = indexContent.indexOf("{", pos) + 1;
                indexContent = indexContent.slice(0, insertPos) + `\n  ${name},` + indexContent.slice(insertPos);
            }
        }
    }

    // Rewrite index
    await fs.writeFile(indexPath, indexContent);

    // Compile all existing client components
    console.log("Client componetns", clientComponents)
    for (let file of clientComponents) {
        // if it's a directory continue
        let absolutePath = `${componentDir}/${file}`;
        let stats = await fs.stat(absolutePath);
        if (stats.isDirectory()) continue;
        let name = file.replace(".vue", "");
        let content = await fs.readFile(`${componentDir}/${file}`, "utf-8");
        let result = await compileSfc(content, `${componentDir}/${file}`, { varName: "fullComponent" });
        await fs.writeFile(`${outDir}/${name}.json`, result.compiled);
    }

    rimrafSync("../server/editor/compiled");
    cpSync(outDir, "../server/editor/compiled", { recursive: true });
}

async function main() {
    console.log("starting compile")
    const componentDir = "src/lib/compiler/clientComponents";
    const outDir = "src/lib/compiler/clientComponentsCompiled";
    compileComponents(componentDir, outDir);
    console.log("compiled")
    //@ts-ignore
    const watcher = fs.watch(componentDir, { recursive: false }, async (eventType, filename) => {
        if (filename && filename.endsWith(".vue")) {
            await compileComponents(componentDir, outDir);
        }
    });
    var serverComponentDir = "../server/src/renderer/editorGui"
    var serverOutDir = "../server/src/renderer/editorGuiCompiled"
    compileComponents(serverComponentDir, serverOutDir);
    console.log("Compiled server")
    //@ts-ignore
    const serverWatcher = fs.watch(serverComponentDir, { recursive: false }, async (eventType, filename) => {
        if (filename && filename.endsWith(".vue")) {
            await compileComponents(serverComponentDir, serverOutDir);
        }
    });
}
main();
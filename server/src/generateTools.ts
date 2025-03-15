import * as esbuild from 'esbuild'
import { mkdir } from 'fs/promises';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function generateTools() {
    let result = await esbuild.build({
        entryPoints: [join(__dirname, "./common/tools/index.ts")],
        bundle: true,
        write: false,
        minify: false,
        // man
        // external: ["*store.ts"],
        plugins: [{
            name: 'example',
            setup(build) {
                // console.log("build", build)
                build.onResolve({ filter: /./ }, (args) => {
                    // console.log("args", args)
                    if (args.kind === "entry-point") {
                        return { path: args.path }
                    }
                    if (args.path.endsWith("store"))
                        return { external: true }
                    return ({ path: join(args.resolveDir, args.path + '.ts') })
                })
            },
        }],
    });
    console.log("writing")
    let outDir = join(__dirname, "../", "build")
    await mkdir(outDir, { recursive: true })
    await writeFile(`${outDir}/tools.js`, result.outputFiles[0].text);
    return result;
}
if (process.argv[1].endsWith(__filename)) {
    generateTools();
}

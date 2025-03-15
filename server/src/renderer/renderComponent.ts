import { readFile } from "fs/promises";
import path from "path";
import * as Vue from "vue"
import { getQuickJS } from "quickjs-emscripten"


export async function serverRenderComponent(compiled) {
    const QuickJS = await getQuickJS()
    const vm = QuickJS.newContext()
    console.log("doing quickjs")

    const result = vm.evalCode(`(async () => {
        return "yeshua loves you";
        // const content = await readFile('example.txt')
        // return content.toUpperCase()
      })()`)
      const promiseHandle = vm.unwrapResult(result)
      console.log("unwraped", promiseHandle.value)
      const resolvedResult = await vm.resolvePromise(promiseHandle)
      console.log("resolved")
      promiseHandle.dispose()
      const resolvedHandle = vm.unwrapResult(resolvedResult)
      console.log("Result:", vm.getString(resolvedHandle))
      resolvedHandle.dispose()
    return;
    
    // const QuickJS = await getQuickJS()
    // // const vm = QuickJS.newContext()
    // const runtime = QuickJS.newRuntime();
    // const ctx = runtime.newContext();
    // try {
    //     // const vueCode = await readFile("./node_modules/@vue/server-renderer/dist/server-renderer.esm-browser.js", "utf-8");
    //     // ctx.evalCode(vueCode);
    //     console.log("evaluated vue")
    //     // runtime.setModuleLoader((moduleName) => {
    //     //     return "null";
    //     //     // const modulePath = path.join(importsPath, moduleName)
    //     //     // if (!modulePath.startsWith(importsPath)) {
    //     //     //     throw new Error("out of bounds")
    //     //     // }
    //     //     // console.log("loading", moduleName, "from", modulePath)
    //     //     // return fs.readFile(modulePath, "utf-8")
    //     // })
    //     console.log("evaluating code")

    //     const result = ctx.evalCode(`
    // (async () => {
    //     console.log("test")
    //     return 'yeshua loves you';
    //     //const app = createSSRApp({
    //     //    data: () => ({ count: 1 }),
    //     //    template: '<button @click="count++">{{ count }}</button>'
    //     //});
    //     //await renderToString(app);
    // })()
    // `);
    //     if (result.error) {
    //         console.log("Execution failed:", ctx.dump(result.error))
    //         result.error.dispose()
    //         return;
    //     }
    //     const promiseHandle = ctx.unwrapResult(result)
    //     console.log("promiseHandle", ctx.unwrapResult(ctx.getPromiseState(promiseHandle)))
    //     runtime.executePendingJobs();
    //     const resolvedResult = await ctx.resolvePromise(promiseHandle)
    //     console.log("resolvedResult")
    //     promiseHandle.dispose()
    //     const resolvedHandle = ctx.unwrapResult(resolvedResult)
    //     console.log("Result:", ctx.getString(resolvedHandle))
    //     resolvedHandle.dispose()
    // } catch (e) {
    //     console.error(e)
    // } finally {
    //     ctx.dispose();
    //     runtime.dispose();
    // }
}
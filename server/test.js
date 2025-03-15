// import { readFile } from "fs/promises";
// import path from "path";
// import * as Q from "quickjs-emscripten"
// import * as Vue from "vue"
const Q = require("quickjs-emscripten");



 async function serverRenderComponent(compiled) {
    const QuickJS = await Q.newAsyncRuntime();
    const vm = QuickJS.newContext()
    console.log("doing quickjs")

    // Evaluate code that uses `readFile`, which returns a promise
    const result = await vm.evalCodeAsync(`(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return 'yeshua loves you';
    })()`)
    
    vm.runtime.executePendingJobs()
    const promiseHandle = vm.unwrapResult(result)
    vm.runtime.executePendingJobs()
    console.log(promiseHandle.value, promiseHandle)

    // Convert the promise handle into a native promise and await it.
    // If code like this deadlocks, make sure you are calling
    // runtime.executePendingJobs appropriately.
    console.log("resolving")
    console.log('vm.runtime.hasPendingJob()', vm.runtime.hasPendingJob());    // <============ return true

    const resolvedResult = await vm.resolvePromise(promiseHandle)
    vm.runtime.executePendingJobs()
    console.log("resolved",resolvedResult)
    promiseHandle.dispose()
    console.log("resolvedResult");
    const resolvedHandle = vm.unwrapResult(resolvedResult)
    console.log("Result:", vm.getString(resolvedHandle))
    resolvedHandle.dispose()
}


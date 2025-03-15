
export async function runUnsafeCode(code) {
    // Create a new isolate limited to 128MB
    const ivm = require('isolated-vm');
    const isolate = new ivm.Isolate({ memoryLimit: 128 });

    // Create a new context within this isolate. Each context has its own copy of all the builtin
    // Objects. So for instance if one context does Object.prototype.foo = 1 this would not affect any
    // other contexts.
    const context = isolate.createContextSync();

    // Get a Reference{} to the global object within the context.
    const jail = context.global;

    // This makes the global object available in the context as `global`. We use `derefInto()` here
    // because otherwise `global` would actually be a Reference{} object in the new isolate.
    jail.setSync('global', jail.derefInto());

    // We will create a basic `log` function for the new isolate to use.
    let value = null;
    jail.setSync('setValue', function (...args) {
        value = JSON.parse(JSON.stringify(args[0]));
    });
    jail.setSync('log', function (...args) {
        value = JSON.parse(JSON.stringify(args[0]));
    });


    // > hello world

    // Let's see what happens when we try to blow the isolate's memory
    const hostile = await isolate.compileScript(code);

    // Using the async version of `run` so that calls to `log` will get to the main node isolate
    try {
        let result = await hostile.run(context);
        console.log("Result is ", result)
        console.log("the result is", value)
        return { value };
    } catch (err) {
        console.error("error running js", err);
        return { error: err, value: null }
    }
}
// const ivm = require('isolated-vm');
import * as esbuild from 'esbuild'



// Function to safely serialize objects with possible circular references
function safeSerialize(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'function') {
      return '[Function]';
    }
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  }, 2);
}

// export async function runInsecureRoute(code, req, res) {
//   // Compile the code with esbuild
//   let compiled = esbuild.transformSync(code, {
//     loader: 'ts',
//     target: 'es2020',
//     format: 'cjs',
//   });
  
//   // Create a wrapper that extracts the default export and calls it
//   const wrappedCode = `
//     try {
//       // Create module context
//       const module = { exports: {} };
//       const exports = module.exports;
      
//       // Execute the compiled code
//       ${compiled.code}
      
//       // Extract the default export function
//       const userFunction = module.exports.default || module.exports;
      
//       if (typeof userFunction !== 'function') {
//         throw new Error('The exported value must be a function');
//       }
      
//       // Parse the serialized req and res
//       const reqObj = ${safeSerialize({bob:true}).replace(/'/g, "\\'")};
//       const resObj = ${safeSerialize({bob: true}).replace(/'/g, "\\'")};
      
//       // Call the function and set the result
//       const result = userFunction(reqObj, resObj);
//       setResult(result);
//     } catch (error) {
//       setResult({ error: error.message || 'Unknown error' });
//     }
//   `;
//   console.log(wrappedCode);

//   // Run the wrapped code in the isolated VM
//   let result = await runInsecureCode(wrappedCode);
//   console.log("result", result);
// }

// export async function runInsecureCode(code) {
//   // Initialize value with default properties.
//   let value = { result: null, error: null };

//   const isolate = new ivm.Isolate({ memoryLimit: 8 });
//   const context = await isolate.createContext();
//   const jail = context.global;

//   await jail.set('global', jail.derefInto());

//   const setResultFunction = function (result) {
//     // Assign result to the value object.
//     value.result = result;
//   };

//   await context.global.set('setResult', new ivm.Callback(setResultFunction));

//   // await context.global.set('')

//   try {
//     await context.eval(code);
//     if (value.result === null) {
//       // If setResult was not called, indicate failure to set the result.
//       value.error = 'setResult was not called';
//     }
//   } catch (err) {
//     // Capture and format the error with context.
//     value.error = formatErrorWithContext(code, err);
//   }

//   return value;
// }

// function formatErrorWithContext(source, error) {
//   const match = error.message.match(/<isolated-vm>:(\d+):(\d+)/);
//   if (!match) {
//     return error.message;
//   }

//   const lineNumber = parseInt(match[1], 10);
//   const columnNumber = parseInt(match[2], 10);

//   const lines = source.split('\n');
//   const errorLine = lines[lineNumber - 1];
//   const contextLines = [
//     lines[lineNumber - 2] || '', // Line before error
//     errorLine,                   // Line with error
//     lines[lineNumber] || ''      // Line after error
//   ];

//   return [
//     `Error at line ${lineNumber}, column ${columnNumber}: ${error.message}`,
//     'Context:',
//     (contextLines[0] ? `  ${contextLines[0]}` : ''),
//     `> ${contextLines[1]}`,
//     (contextLines[2] ? `  ${contextLines[2]}` : '')
//   ].join('\n');
// }
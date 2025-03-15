import esbuild from 'esbuild';import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames
/**
 * INSECURE! Runs a TRUSTED method from a given TypeScript code string in a CommonJS format.
 * 
 * @param code - The TypeScript code string to be compiled and executed.
 * @param req - The request object to be passed to the exported function.
 * @param res - The response object to be passed to the exported function.
 * @returns The result of the executed function.
 * 
 * @throws Will throw an error if the compiled code does not export a function or if there is an error during execution.
 * 
 * @note This function is only for TRUSTED code and is extremely insecure for untrusted code.
 */
export async function runMethodPrivate(code, ...args) {
    console.log(fs, path, promisify, uuidv4);
    let os = require('os');
    // esbuild compile with CommonJS format
    let compiled = await esbuild.transform(code, {
        loader: 'ts',
        target: 'es2020',
        format: 'cjs',
    });

    // Wrap the compiled code in a function context that captures the exported function
    const wrappedCode = `
        const exports = {};
        const module = { exports };
        
        // Set up globals that might be needed
        const process = global.process;
        const console = global.console;
        const Buffer = global.Buffer;
        const setTimeout = global.setTimeout;
        const clearTimeout = global.clearTimeout;
        const setInterval = global.setInterval;
        const clearInterval = global.clearInterval;
        
        ${compiled.code}
        
        return module.exports.default || module.exports;
    `;

    try {
        // Create a function that will return the exported default function
        console.log(wrappedCode)
        const getExportedFunc = new Function('require', 'global', wrappedCode);
        const exportedFunc = getExportedFunc(require, global);

        // Execute the exported function with req and res
        if (typeof exportedFunc === 'function') {
            const result = await exportedFunc(...args);
            return result;
        } else {
            throw new Error('Compiled code did not export a function');
        }
    } catch (error) {
        console.error('Error executing compiled code:', error);
        throw error;
    }
}

// // Example usage
// runMethodPrivate(`
//     import { promisify } from 'util';
//     export default async function(req, res) {
//     console.log("hello world", req, promisify);
//     return "hello world";
// }`, { test: "proeprty" }, {})
//     .then(result => console.log('Result:', result))
//     .catch(err => console.error('Error:', err));
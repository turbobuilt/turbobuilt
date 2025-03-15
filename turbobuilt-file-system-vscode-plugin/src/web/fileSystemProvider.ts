/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
console.log("DOING FS PROV")

let callbacks = {} as any;
const callMethodChannel = new BroadcastChannel("callMethod");
const callMethodResponseChannel = new BroadcastChannel(`callMethod:response`);
callMethodResponseChannel.onmessage = function (event) {
    let { id, result, error } = event.data;
    // console.log("ID IS", id, result)
    let data = callbacks[id];
    if (!data) {
        console.error("No callback for id", id);
        return;
    }
    let { resolve, reject } = data;
    delete callbacks[id];
    if (!result && !error) {
        console.log(event.data)
    }
    if (error || result?.error) {
        console.error("Error in callMethod", error || result.error);
        reject(result.error || error);
    } else {
        resolve(result);
    }
}
function callMethod(name: string, args: any[], options?: any) {
    let result = new Promise((resolve, reject) => {
        const id = Date.now() + "_" + Math.random().toString().slice(2);
        callbacks[id] = { resolve, reject };
        callMethodChannel.postMessage({ id, name, args, options });
    }) as any;
    return result;
}

const callFunctionChannel = new BroadcastChannel("callFunction");
const callFunctionResponseChannel = new BroadcastChannel(`callFunction:response`);
callFunctionResponseChannel.onmessage = function (event) {
    let { id, result, error } = event.data;
    let data = callbacks[id];
    if (!data) {
        console.error("No callback for id", id);
        return;
    }
    let { resolve, reject } = data;
    delete callbacks[id];
    if (error || result.error) {
        console.log("ERROR calling function", result.error || error);
        reject(result.error || error);
    } else {
        resolve(result);
    }
}
export function callFunction(name: string, args: any[], options?: any) {
    let result = new Promise((resolve, reject) => {
        const id = Date.now() + "_" + Math.random().toString().slice(2);
        callbacks[id] = { resolve, reject };
        callFunctionChannel.postMessage({ id, name, args, options });
    }) as any;
    return result;
}


import * as vscode from 'vscode';

const path = {
    posix: {
        basename(file: string) {
            return file.split("/").slice(-1)[0]
        },
        dirname(file: string) {
            return file.split("/").slice(0, -1).join("/")
        }
    }
}

export class File implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    data?: Uint8Array;

    constructor(name: string) {
        this.type = vscode.FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
    }
}

export class Directory implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    entries: Map<string, File | Directory>;

    constructor(name: string) {
        this.type = vscode.FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
        this.entries = new Map();
    }
}

export type Entry = File | Directory;

export class MemFS implements vscode.FileSystemProvider {

    private _onDidRunOperation: vscode.EventEmitter<vscode.FileOperationEvent> = new vscode.EventEmitter<vscode.FileOperationEvent>();
    readonly onDidRunOperation: vscode.Event<vscode.FileOperationEvent> = this._onDidRunOperation.event;
	private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;
    private pasteOperations: number = 0;

    // Add helper to find file in our in‑memory tree (simple directory traversal)
    private findFile(path: string): File | undefined {
        const parts = path.split('/').filter(p => p.length);
        let current: Directory = this.root;
        for (let i = 0; i < parts.length - 1; i++) {
            const entry = current.entries.get(parts[i]);
            if (entry && entry instanceof Directory) {
                current = entry;
            } else {
                return undefined;
            }
        }
        return current.entries.get(parts[parts.length - 1]) as File;
    }

    constructor() {
        this.onDidRunOperation(this.handleFileOperation, this);

        // Listen for file updates from chat responses
        const fileUpdateChannel = new BroadcastChannel("updateFile");
        fileUpdateChannel.onmessage = (event) => {
            const { uri, file, url } = event.data;
            const fileEntry = this.findFile(uri);
            if (fileEntry) {
                fileEntry.data = new TextEncoder().encode(file);
                fileEntry.mtime = Date.now();
                this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri: vscode.Uri.parse(uri) }]);
                console.log("File updated via broadcast:", uri, url);
            }
        };

        // create channel to call functions in the plugin
        const pluginFunctionChannel = new BroadcastChannel("pluginFunction");
        const pluginFunctionResponseChannel = new BroadcastChannel(`pluginFunction:response`);
        pluginFunctionChannel.onmessage = async (event) => {
            let { id, name, args, options } = event.data;
            try {
                let result;
                if (name === "updateFile") {
                    // update local copy of file
                    const uri = args[0];
                    const contents = args[1];
                    // now update locally
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), new TextDecoder().decode(contents));
                        vscode.workspace.applyEdit(edit);
                    }

                    // 
                    // this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri: vscode.Uri.parse(uri) }]);
                }
                callFunctionResponseChannel.postMessage({ id, result });
            } catch (err) {
                console.error("error doing callfunction", err);
                callFunctionResponseChannel.postMessage({ id, error: err });
            }
        }

    }

    handleFileOperation(event: vscode.FileOperationEvent) {
        if (event.operation === vscode.FileOperation.Copy) {
            this.pasteOperations++;
            // Defer action until all paste operations are completed
            setTimeout(() => {
                this.pasteOperations--;
                if (this.pasteOperations === 0) {
                    this.onAllFilesPasted();
                }
            }, 100); // Adjust the timeout as needed
        }
    }

    onAllFilesPasted() {
        // Perform the deferred action here
        console.log('All files have been pasted');
    }

    root = new Directory('');
    async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        let result = await callMethod("workspaceFile.statWorkspaceFile", [uri.path]);
        if (!result.data) {
            throw vscode.FileSystemError.FileNotFound();
        }
        return result.data;
    }

    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        let result = await callMethod("workspaceFile.listDirectory", [uri.path]);
        try {
            var results = result.data.items.map((item: any) => [item.path, item.type === "dir" ? vscode.FileType.Directory : vscode.FileType.File]);
        } catch (err) {
            console.error(err);
        }
        return results;
    }

    async readFile(uri: vscode.Uri) {
        let result = await callFunction("getWorkspaceFile", [uri.path]);
        if (result.exists === false) {
            throw vscode.FileSystemError.FileNotFound();
        }
        return result;
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): Promise<void> {
        let result = await callFunction("saveWorkspaceFile", [uri.path, content]);
    }

    async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }) {
        let result = await callFunction("renameWorkspaceFile", [oldUri.path, newUri.path]);
    }

    async delete(uri: vscode.Uri) {
        let result = await callFunction("deleteWorkspaceFile", [uri.path]);
    }

    async createDirectory(uri: vscode.Uri) {
        let result = await callMethod("workspaceFile.createDirectory", [uri.path]);
    }

    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event

    watch(_resource: vscode.Uri): vscode.Disposable {
        return new vscode.Disposable(() => { });
    }
}
import * as vscode from 'vscode';
// var Buffer = require('buffer/').Buffer  // note: the trailing slash is important!
// import * as Buffer from "buffer";
import { callFunction, MemFS } from './fileSystemProvider';

const Buffer = {
	from(val: string) {
		return new TextEncoder().encode(val);
	}
}

export function activate(context: vscode.ExtensionContext) {
	// console.log('MemFS says "Hello" Yeshua loves you', "context is", context);
    console.log("activating extsnsionsss")

	const memFs = new MemFS();
	context.subscriptions.push(vscode.workspace.registerFileSystemProvider('memfs', memFs, { isCaseSensitive: true }));
	let initialized = false;


    // debugger;

    // listen for postmessages
    // this is a web worker
    self.onmessage = (event) => {
        console.log("Received message from main thread!!!:", event.data);
        // Handle the message
    };


	// context.subscriptions.push(vscode.commands.registerCommand('memfs.reset', _ => {
    //     console.log("initializing")
	// 	for (const [name] of memFs.readDirectory(vscode.Uri.parse('memfs:/'))) {
	// 		memFs.delete(vscode.Uri.parse(`memfs:/${name}`));
	// 	}
	// 	initialized = false;
	// }));

	// context.subscriptions.push(vscode.commands.registerCommand('memfs.addFile', _ => {
    //     console.log("initializing")
	// 	if (initialized) {
	// 		memFs.writeFile(vscode.Uri.parse(`memfs:/file.txt`), Buffer.from('foo'), { create: true, overwrite: true });
	// 	}
	// }));

	// context.subscriptions.push(vscode.commands.registerCommand('memfs.deleteFile', _ => {
    //     console.log("initializing")
	// 	if (initialized) {
	// 		memFs.delete(vscode.Uri.parse('memfs:/file.txt'));
	// 	}
	// }));

    // let testStr = new TextEncoder().encode('foo');
    // // vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('memfs:/'), name: "MemFS - Sample" });
	// context.subscriptions.push(vscode.commands.registerCommand('memfs.workspaceInit', _ => {
    //     console.log("not opening default")
	// 	// vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('memfs:/'), name: "MemFS - Sample" });
	// }));

    console.log("making broadcast channel commandChannel")
    const commandChannel = new BroadcastChannel("commandChannel");
    // commandChannel.onmessage = async function(event) {
    //     let { command, args } = event.data;
    //     switch (command) {
    //         case "vscode:open":
    //             console.log("OPENING", args[0])
    //             let workspacesCount = vscode.workspace.workspaceFolders?.length || 0;
    //             console.log("WORKSPACE COUNT", workspacesCount)
    //             // close all open editors
    //             await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    //             console.log("CLOSED ALL");
    //             // close all open workspaces
    //             await vscode.commands.executeCommand("workbench.action.closeFolder");
    //             // vscode.
    //             // vscode.workspace.updateWorkspaceFolders(0, workspacesCount, { uri: vscode.Uri.parse(args[0]), name: "DEFAULT" });
    //             // vscode.workspace.
    //             await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse("/"), {
    //                 forceNewWindow: false // Set to true if you want to open in new window
    //             });
    //             break;
    //     }
    // }
    console.log("Getting workspaces")
    callFunction("getWorkspaces", []).then((result: any) => {
        console.log("getWorkspaces", result);
        // create a new workspace
        // vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.parse("memfs:/"), {});
        // for (let workspace of result) {
        //     console.log('adding root folder')
        //     vscode.commands.executeCommand("workbench.action.addRootFolder", vscode.Uri.parse("memfs:/" + workspace.guid + "/"));
        // }

        // vscode.workspace.
        let workspacesCount = vscode.workspace.workspaceFolders?.length || 0;
        vscode.workspace.updateWorkspaceFolders(0, workspacesCount, ...result.map((workspace: any) => ({ uri: vscode.Uri.parse("memfs:/" + workspace.guid + "/"), name: workspace.organizationName })));
            // [{ uri: vscode.Uri.parse(args[0]), name: "DEFAULT" }]);
    });



    const fileSelectedChannel = new BroadcastChannel("fileSelectedChannel");
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            console.log("The uri is", editor.document.uri);
            
            fileSelectedChannel.postMessage({ path: editor.document.uri.path });
        }
    });
}
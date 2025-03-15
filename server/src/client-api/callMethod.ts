import { auth } from "lib/auth";
import { HttpError } from "lib/server";
import { WorkspaceFile } from "methods/workspace/WorkspaceFile.model";
import mysql from "mysql2"
import { getServerToolsString } from "renderer/getServerToolsString";
import Sandbox from 'v8-sandbox';
import { runInsecureCode } from "./runClientCode";
import { dirname, resolve } from "path";

export async function clientApiCallMethod(params) {
    const { req, res, body, url, host } = params;
    let authInfo = await auth(req);
    if (!authInfo) {

    }
    try {
        let { method, args, workspaceGuid } = body;
        if (!workspaceGuid) {
            throw new HttpError(400, `no workspace identifier found. contact support!`)
        }
        if (workspaceGuid && authInfo) {

        }
        console.log("will get content")
        let content = await getFile(method, params?.organization?.guid)

        const sandbox = new Sandbox();

        // const code = 'setResult({ value: 1 + inputValue });';
        const tools = await getServerToolsString();
        const code = `
        ${tools}
        
        // content
        ${content}
        `;
        
        let { error, result } = await runInsecureCode(code);

        // const { error, value } = await sandbox.execute({ code, timeout: 3000, globals: { inputValue: 2 } });
        if (error) {
            console.error(error)
            // throw new HttpError(400, "Error running function: " + error)
            res.end(JSON.stringify({ error: error }));
        } else {
            console.log("Returing", result)
            // return result.result;
            if (result.contentType) {
                res.writeHead(200, { 'Content-Type': result.contentType });
                res.end(JSON.stringify({ result: JSON.parse(result.result) }));
            } else {
                res.writeHead(200);
                res.end(JSON.stringify({ result: result.result }));
            }
        }
    } catch (e) {
        console.error("Error calling client method", body.method, e);
        console.error(e);
        if (e instanceof HttpError) {
            res.writeHead(e.status, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: e.message, details: e.details }));
        }
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.toString() }));
    }
}

async function getFile(method, organizationGuid, ) {
    let items = "";
    if (method.split("/").at(-1).indexOf(".") === -1)
        items = `${mysql.escape(method + ".js")},${mysql.escape(method + ".ts")}`;
    else
        items = mysql.escape(method);
    let [workspaceFile] = await WorkspaceFile.fromQuery(`SELECT * 
        FROM WorkspaceFile
        WHERE path IN (${items})
        ${organizationGuid ? " AND organization= " + mysql.escape(organizationGuid) : ""}
        `, []);

    if (!workspaceFile) {
        throw new HttpError(400, `method "${method}" not found`);
    }
    console.log("workspace file is", workspaceFile)
    let content = workspaceFile.content;

    let regex = /import\s+(.+?)\s+from\s+['"]@turbobuilt\/tools['"]/;
    content = content.replace(regex, function (val, $1) {
        return `const ${$1} = global.turbobuiltTools;`;
    });

    regex = /import\s+(.+?)\s+from\s+['"](\..+?)['"]/g;
    console.log("DOING REGEX");

    content = await replaceAsync(content, regex, async function (val, $1, $2) {
        console.log("REPLACING", val);
        $2 = resolve("/" + dirname(method), $2).slice(1)
        return `const ${$1} = (function(){return ${await getFile($2, organizationGuid)};\nreturn fullComponent;})()`
    });
    return content;
}

async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (full, ...args) => {
        promises.push(asyncFn(full, ...args));
        return full;
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}
import bun from "bun";
import { readdir } from "fs/promises";
import { join, normalize } from "path";
import { exec } from "child_process";
import { User } from "../methods/user/models/User.model";
import { Organization } from "../methods/organization/Organization.model";
import { servePublic, servePublic as servePublicOrError } from "./public";
import https from "https";
import http from "http";
import { readFileSync } from "fs";
import tls from "tls";
import { createServer } from "../lib/node-server";
import db from "../lib/db";
import { Website } from "../methods/website/Website.model";
import { HttpError } from "../lib/server";
import { WebsitePageTemplate } from "../methods/websitePageTemplate/WebsitePageTemplate.model";
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { serverRenderComponent } from "./renderComponent";
import * as zlib from "zlib";
import ejs from "ejs";
import { readFile } from "fs/promises";
import { WebsitePageTemplateBlock } from "../methods/websitePageTemplate/WebsitePageTemplateBlock.model";
import { WebsitePageTemplateUrlSegment } from "../methods/websitePageTemplate/WebsitePageTemplateUrlSegment.model";
import { customStringify } from "lib/jsonStringifyWithFunctions";
import * as esbuild from 'esbuild'
import { getServerToolsString } from "./getServerToolsString";
import { WebsitePageItem } from "methods/websitePageItem/WebsitePageItem.model";
import { getProductsXml } from "methods/item/getProductsXml";
import { WorkspaceFile } from "methods/workspace/WorkspaceFile.model";
import { renderPreviewEditor } from "./previewEditor";
import mysql from "mysql2";
import { runInsecureCode, runInsecureRoute } from "client-api/runClientCode";
import { runMethodPrivate } from "client-api/runMethodPrivate";

export const publicDir = join(process.cwd(), "public");
let sites = {} as { [domain: string]: any }

let ejsTemplate = null;
let vueString = null;

export async function startRendererServer() {
    // kill ports in use
    // exec("kill -9 $(lsof -t -i:4122)");
    // console.log("starting render server")

    let httpServer: http.Server;
    let httpsServer: https.Server;
    console.log("current env is", process.env.NODE_ENV);
    if (process.env.NODE_ENV === "production") {
        httpServer = await createServer(false, handleRedirectRequest);
        httpsServer = await createServer(true, handleSiteRequest) as https.Server;
        console.log("render server started on port 80 and 443");
        httpServer.listen(80, "0.0.0.0");
        httpsServer.listen(443, "0.0.0.0");
    } else {
        httpServer = await createServer(false, handleSiteRequest);
        let port = 4122;
        httpServer.listen(port, "127.0.0.1");
        // console.log("Server started on http://localhost:4122");
        console.log(`Server started on  http://mysite.co:${port}`);
    }

    console.log("going");
    return;
}

export async function handleRedirectRequest(params) {
    if (params.url.pathname.startsWith("/.well-known") && await servePublic(params.req, params.res, params.url, publicDir)) {
        console.log("serving public .well-known", params.url.pathname)
        return;
    } else {
        console.log("redirecting to https", params.url?.pathname)
        console.log("headers sent", params.res.headersSent)
        // check and see if headers sent
        if (params.res.headersSent) {
            return;
        }

        // redicrt to https
        params.res.writeHead(302, {
            Location: `https://${params.req.headers.host}${params.req.url}`
        });
        params.res.end();
        console.log("redirected")
    }
}
export interface PageMatch {
    page: WebsitePageTemplate & {
        url?: WebsitePageTemplateUrlSegment[];
        urlOverride?: boolean;
    };
    variableValues: any[];
}
export async function handleSiteRequest(params) {
    console.log("handling site request", params.url.pathname);
    let hostname = params.req.headers.host;
    let domain = hostname.split(":")[0];
    if (domain.startsWith("www.")) {
        params.res.writeHead(302, {
            Location: `https://${domain.substring(4)}${params.req.url}`
        });
        params.res.end();
    }
    if (!sites) {
        let results = await Website.fetch();
        for (let website of results) {
            sites[website.domain] = website;
        }
    } else if (!sites[domain]) {
        let [website] = await Website.fromQuery(`SELECT * FROM Website WHERE domain = ?`, [domain]);
        if (website) {
            sites[domain] = website;
        } else {
            return new HttpError(404, "Website doesn't exist");
        }
    }
    let website = sites[domain] as Website;
    if (!website) {
        return new HttpError(404, "Website doesn't exist");
    }

    // now get the page by path
    let url = params.url.pathname;
    if (url === "/products-inventory.xml") {
        params.res.writeHead(200, {
            "Content-Type": "text/xml",
        });
        let xml = await getProductsXml(website.guid);
        params.res.end(xml);
        return;
    }

    console.log("url is", url);
    let parts = url.split("/").slice(1);
    parts = [domain.replace(/^www\./, "")].concat(parts);
    console.log("parts", parts);

    // check for rendering templates
    if (parts.at(-1) === "" || parts.at(-1).match(/page\.[a-z]{2,4}$/)) {
        var conditions = [], queryParams = [];
        var workspaceFileQuery = `SELECT WorkspaceFile.*
        FROM WorkspaceFile
        WHERE `;
        for (let i = 0; i < 15 && i < parts.length; ++i) {
            // if it ends in /, look for index.*
            if (parts[i] === "") {
                conditions.push(`WorkspaceFile.pathPart${i + 1} like 'indexPage.%' or WorkspaceFile.pathPart${i + 1} like 'index.%'`);
                break;
            }
            let partIndex = i + 1;
            conditions.push(`(WorkspaceFile.pathPart${partIndex} = ? OR WorkspaceFile.pathPart${partIndex} LIKE '[%')`);
            queryParams.push(parts[i]);
        }
        conditions.push(`(WorkspaceFile.type = 'file' OR WorkspaceFile.type IS NULL)`);
        conditions.push(`WorkspaceFile.organization = ?`);
        queryParams.push(website.organization);
        workspaceFileQuery += conditions.join(" AND ");
        console.log(mysql.format(workspaceFileQuery, queryParams));
        let [workspaceFile] = await db.query(workspaceFileQuery, queryParams) as WorkspaceFile[];

        if (workspaceFile) {
            // if it ends in .html return it
            if (workspaceFile.path.endsWith(".html")) {
                let html = Buffer.from(workspaceFile.content).toString("utf-8");
                params.res.writeHead(200, {
                    "Content-Type": "text/html",
                    "Content-Length": html.length,
                });
                params.res.end(html);
                return;
            }
        }
    }
    // check for js/ts routes
    else if (parts.at(-1).match(/(R|-r)oute\.[tj]s$/)) {
        var conditions = [], queryParams = [];
        var workspaceFileQuery = `SELECT WorkspaceFile.*,
        (SELECT Organization.runsUntrustedCode FROM Organization WHERE Organization.guid = WorkspaceFile.organization) as runsUntrustedCode
        FROM WorkspaceFile
        WHERE `;
        for (let i = 0; i < 15 && i < parts.length; ++i) {
            // if it ends in /, look for index.*
            if (parts[i] === "") {
                conditions.push(`WorkspaceFile.pathPart${i + 1} like 'indexPage.%' or WorkspaceFile.pathPart${i + 1} like 'index.%'`);
                break;
            }
            let partIndex = i + 1;
            conditions.push(`(WorkspaceFile.pathPart${partIndex} = ? OR WorkspaceFile.pathPart${partIndex} LIKE '[%')`);
            queryParams.push(parts[i]);
        }
        conditions.push(`(WorkspaceFile.type = 'file' OR WorkspaceFile.type IS NULL)`);
        conditions.push(`WorkspaceFile.organization = ?`);
        queryParams.push(website.organization);
        workspaceFileQuery += conditions.join(" AND ");
        console.log(mysql.format(workspaceFileQuery, queryParams));
        let [workspaceFile] = await db.query(workspaceFileQuery, queryParams) as (WorkspaceFile & { runsUntrustedCode: boolean })[];

        if (workspaceFile && workspaceFile.runsUntrustedCode) {
            console.log("GOT THE FILE", workspaceFile);
            let content = Buffer.from(workspaceFile.content).toString("utf-8");
            let result = await runMethodPrivate(content, params.req, params.res, params);
            let res = params.res as http.ServerResponse;
            if (!res.headersSent) {
                let data = null, contentType = null
                if (result) {
                    if (typeof result === "object") {
                        contentType = "application/json";
                        data = JSON.stringify(result);
                    } else {
                        data = result;
                    }
                }
                params.res.writeHead(200, {
                    "Content-Type": contentType || "text/plain",
                    "Content-Length": data.length,
                });
                params.res.end(data);
            } else {
                if (!res.closed)
                    params.res.end();
            }
            return;
        }
    }

    let pages = await db.query(`SELECT WebsitePageTemplate.*, WebsiteWebsitePageTemplate.url, WebsiteWebsitePageTemplate.urlOverride, WebsiteWebsitePageTemplate.guid as websiteWebsitePageTemplateGuid
        FROM WebsitePageTemplate 
        LEFT JOIN WebsiteWebsitePageTemplate ON WebsitePageTemplate.guid = WebsiteWebsitePageTemplate.websitePageTemplate
        WHERE (WebsiteWebsitePageTemplate.website = ?
                OR (WebsitePageTemplate.addToAllSites = 1 AND WebsitePageTemplate.organization = ?)
            )
            AND ((WebsiteWebsitePageTemplate.url IS NOT NULL AND WebsiteWebsitePageTemplate.url <> "") OR (defaultUrl IS NOT NULL AND defaultUrl <> ""))
        `, [website.guid, website.organization]) as (WebsitePageTemplate & { url?: WebsitePageTemplateUrlSegment[], urlOverride?: boolean })[];

    let match: PageMatch = null;
    pageLoop: for (let page of pages) {
        let variableValues = [];
        let pageUrl = page.addToAllSites ? page.defaultUrl : (page.urlOverride ? page.url : page.defaultUrl);
        let parts = url.split("?")[0].split("/").slice(1);
        if (url !== "/favicon.ico") {
            // console.log("url is", url, "parts are", parts);
            // console.log("testing page", page.name, "the parts are", parts, "page url is", pageUrl, "pageUrl is", pageUrl);
        }

        if (parts.length !== pageUrl.length) {
            continue;
        }
        for (let i = 0; i < pageUrl.length; ++i) {
            if (pageUrl[i].value == null)
                pageUrl[i].value = "";
            if (pageUrl[i].type === 'text' && pageUrl[i].value !== parts[i]) {
                continue pageLoop
            } else if (pageUrl[i].type === 'variable') {
                variableValues.push({ "key": pageUrl[i].value, "value": parts[i] });
            }
        }
        match = { page, variableValues };
        break;
    }
    if (match === null) {
        return new HttpError(404, "Page not found");
    }

    let html = await renderPage({ match, website });

    params.res.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": html.length,
    });

    params.res.end(html);
}

export async function renderPage(options: { match: PageMatch, website: Website, organization?: string, authToken?: string, preview?: boolean }) {
    let { match, website } = options;
    let baseline = ejsTemplate ? ejsTemplate : ejs.compile(await readFile(join(__dirname, "baseline.ejs"), "utf-8"));
    vueString = vueString ? vueString : `<script>${await readFile("./node_modules/vue/dist/vue.runtime.global.prod.js")}</script>`;

    // esbuild
    console.log(join(__dirname, "../../../client/src/store"));
    let toolsSrc = await getServerToolsString();
    let content = [`<script>window.routeParameters = ${JSON.stringify(match.variableValues)}</script>`, `<script>\n// turbobuilt tools\n${toolsSrc}</script>`];
    content.push(`<script>const _website = ${customStringify(website)};</script>`);
    content.push(`<script>const _authToken = "${options.authToken || ''}";</script>`);
    content.push(...await Promise.all(match.page.content.blocks.map((block, index) => renderBlock({ block, index, variableValues: match.variableValues, page: match.page }))));
    let title = website.name;
    if (match.variableValues?.find(item => item.key === "websitePage.identifier")) {
        let websitePageItems = await db.query(`SELECT Item.name
        FROM WebsitePageItem
        JOIN Item ON Item.guid = WebsitePageItem.item
        JOIN WebsitePage ON WebsitePage.guid = WebsitePageItem.websitePage
        WHERE WebsitePage.identifier = ?`, [match.variableValues.find(item => item.key === "websitePage.identifier").value]);
        if (websitePageItems.length) {
            title = websitePageItems[0].name + " - " + title;
        }
    }
    content.push(await renderPreviewEditor());
    let html = baseline({
        content: content.join("\n\n"),
        vueString,
        title,
        description: "description"
    });
    return html;
}
var escape = require('escape-html');

async function renderBlock(params: { block: WebsitePageTemplateBlock, index, variableValues: any, page: WebsitePageTemplate }) {
    let { block, index, variableValues, page } = params;
    let compiled = block.component.compiled;
    if (!compiled) {
        console.log(">>no compiled content for", block.component.path);
        return "";
    }
    let compiledParts = JSON.parse(compiled.toString('utf-8'));
    if (!compiledParts) {
        return `
            <div id="block-${index}" style="color: red; padding: 15px;">
                <b>Error no compiled content for ${block.component.path}</b>
                <div style="height: 20px"></div>
            </div>
        `
    }
    if (compiledParts.error) {
        let [workspaceFile] = await WorkspaceFile.fromQuery(`SELECT *
            FROM WorkspaceFile
            WHERE guid = ?`, [block.component.guid]);
        return `
            <div id="block-${index}" style="color: red; padding: 15px;">
                <b>Error occured compiling: ${block.component.path}</b>
                <div style="height: 20px"></div>
                <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; pre-wrap: break-word; font-family: monospace;">
                ${escape(compiledParts.error)?.replace(/\\n/g, "<br>")?.trim()}
                </div>
            </div>
        `;
    }

    block.component.compiledJs = compiledParts.js;
    block.component.compiledCss = compiledParts.css;
    block.component.compiledJs = block.component.compiledJs.replace(/import\s+{([^}]+)}\s*from\s*['"](.+vue.*\.js)['"]/g, function (match, $1, $2) {
        return `const {${$1.replace(/ as /g, ":")}} = Vue`;
    });

    let regex = /import\s+(.+)\s+from\s+['"]@turbobuilt\/tools['"]/;
    block.component.compiledJs = block.component.compiledJs.replace(regex, function (val, $1) {
        return `const ${$1} = window.turbobuiltTools;`;
    });
    let js = `${block.component.compiledJs}\nexport default fullComponent;`;

    return `
<div id="block-${index}" class="component-guid-/${block.component.workspace}${block.component.path}"></div>
<script type=module>
    import component from "data:text/javascript;base64,${Buffer.from(js).toString("base64")}";
    const app = Vue.createApp(component);
    app.mount("#block-${index}");
</script>
<style>
${block.component.compiledCss || ''}
</style>
`
}
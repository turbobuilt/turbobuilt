import bun from "bun";
import { readdir } from "fs/promises";
import { join } from "path";
import { auth } from "./auth";
import { exec } from "child_process";
import { User } from "../methods/user/models/User.model";
import { Organization } from "../methods/organization/Organization.model";
import { createServer } from "./node-server";
import { IncomingMessage, ServerResponse } from "http";
import { renderClientServer } from "./renderClientServer";
import { handleSiteRequest, publicDir } from "../renderer/rendererServer";
import { servePublic } from "../renderer/public";
import { Website } from "methods/website/Website.model";
import { clientApiCallMethod } from "client-api/callMethod";
import { renderComponentPreview } from "renderer/renderComponentPreview";
import { handleStripePaymentSuccess } from "methods/payment/stripe/handleStripePaymentSuccessUrl";
import { serveImage } from "./serveImage";

export class RouteOptions {
    public?: boolean = false;
    useFormData?: boolean = false;
    organizationNotRequired?: boolean = false;
    streamResponse?: boolean = false;
}
export interface RouteParameters {
    req: IncomingMessage,
    res: ServerResponse,
    url: URL,
    searchParams: URLSearchParams,
    isIosApp: boolean,
    isAndroidApp: boolean,
    isWeb: boolean,
    user: User
    organization: Organization
    requestIp: string
    body: any
    website: Website
}
export function route(handler: (params: RouteParameters, ...args: any[]) => any, options: RouteOptions = new RouteOptions()) {
    (handler as any).options = Object.assign(new RouteOptions(), options || {});
    return { handler, options };
}

// generate routes
async function generateRoutes(dir = "../methods") {
    // get all ts files in the methods directory recursively
    let files = await readdir(join(__dirname, dir), { withFileTypes: true });
    let routes = [] as { name: string, path: string, handler: (params: RouteParameters, ...args: any[]) => any, options: RouteOptions }[];
    for (let file of files) {
        if (file.isDirectory()) {
            routes = routes.concat(await generateRoutes(dir + "/" + file.name));
        } else if (file.name.endsWith(".ts")) {
            try {
                let path = dir + "/" + file.name;
                let method = await import(path.replace(/\.ts$/, ""));
                if (!method.default)
                    continue;
                let { handler, options } = method.default;
                let methodIdentifier = `${path}`.replace(/\//g, ".").replace(".ts", "").replace("...methods.", "")
                routes.push({
                    name: methodIdentifier,
                    path,
                    handler,
                    options
                });
            } catch (err) {
                console.error("error registering", file.name, err);
            }
        }
    }
    return routes;
}

export async function startServer({ port, https }) {
    // kill old process
    await new Promise((resolve, reject) => exec(`kill -9 $(lsof -t -i:${port})`).on("exit", resolve));
    let routesList = await generateRoutes();
    let routesMap = Object.fromEntries(routesList.map(r => [r.name, r]));
    let server = await createServer(https, async function (params) {
        let { req, res, body, url, host } = params;
        let isIosApp = req.headers.isiosapp === "true";
        let isAndroidApp = req.headers.isandroidapp === "true";
        let isWeb = !isIosApp && !isAndroidApp;
        let ip: any = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log("path", url.pathname, "host", host, "ip", ip, "isIosApp", isIosApp, "isAndroidApp", isAndroidApp, "isWeb", isWeb);
        let last = url.pathname.split("/").pop();
        let imgId = last.match(/\[img%20([^\/]+)\]$/)?.[1];
        if (imgId) {
            // if the last part of the path is an image, serve it
            return serveImage(params, imgId);
        }
        // if it's not the portal, and it's not a function, render a client site
        else if (url.pathname.startsWith("/function") === false && !host.endsWith("smarthost.co") && !host.endsWith("portal.turbobuilt.com") && !host.endsWith("localhost")) {
            console.log("rendering client site", host)
            return handleSiteRequest(params);
        } else if (url.pathname.startsWith("/stripe-payment-success")) {
            return handleStripePaymentSuccess(params);
        } else if (url.pathname.startsWith("/api") === false && url.pathname.startsWith("/function") === false && await servePublic(req, res, url, publicDir)) {
            console.log("serving public", url.pathname)
            return;
        } else if (url.pathname.startsWith("/client-api/method") && req.method === "POST") {
            return clientApiCallMethod(params);
        } else if (url.pathname.startsWith("/component-preview") && req.method === "GET") {
            // read authToken cookie
            let authToken = req.headers.cookie?.split("; ").find(c => c.startsWith("authToken="))?.split("=")[1];
            if (!authToken) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "Unauthorized - you are not logged in" }));
            }
            // req.headers["authorization"] = authToken;
            // let authenticationInfo = await auth(req);
            // let routeParams: RouteParameters = { req, res, url, searchParams: url.searchParams, user, organization, isIosApp, isAndroidApp, isWeb, requestIp: ip, body, website: null };
            return renderComponentPreview(params);
        }

        if (url.pathname.startsWith("/api") === false && url.pathname.startsWith("/function") === false) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: `"${url.pathname}" not found` }));
        }

        if (req.method === "POST" && (url.pathname === "/api/method" || url.pathname === "/function")) {
            let methodName = req.headers['method-name'] || body?.method;
            console.log("method name is", methodName);
            let method = routesMap[methodName]?.handler;
            if (!method) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: `Method "${body.method}" not found ${JSON.stringify(body)}` }));
            }
            let [authenticationInfo, website] = await Promise.all([
                auth(req),
                url.pathname === "/function" ? (async () => {
                    let [website] = await Website.fromQuery(`SELECT * FROM Website WHERE domain=?`, [host]);
                    return website;
                })() : null
            ]);
            if (!routesMap[methodName]?.options?.public) {
                if (!authenticationInfo) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: "Unauthorized - you are not logged in" }));
                } else if (!authenticationInfo.organization && !routesMap[methodName]?.options?.organizationNotRequired) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: "Unauthorized - you are not part of an organization" }));
                } else if (!authenticationInfo.user) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: "Unauthorized - user not found" }));
                }
            }
            var user, organization;
            if (authenticationInfo) {
                user = authenticationInfo.user;
                organization = authenticationInfo.organization;
            }
            try {
                console.log("CALL:", req.headers['method-name'] || body?.method);
                let params: RouteParameters = { req, res, url, searchParams: url.searchParams, user, organization, isIosApp, isAndroidApp, isWeb, requestIp: ip, body, website };
                if (routesMap[methodName]?.options?.streamResponse) {
                    await method(params, ...(body?.args || []));
                    if (!res.closed)
                        res.end();
                    return;
                } else {
                    let responseData = await method(params, ...(body?.args || []));
                    if (res.headersSent) {
                        console.log("headers sent alreeady")
                        return;
                    }
                    // if Buffer
                    if (Buffer.isBuffer(responseData)) {
                        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
                        return res.end(responseData);
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ data: responseData }));
                }
            } catch (e) {
                console.error("Error calling method", req.headers['method-name'] || body?.method, e);
                console.error(e);
                if (e instanceof HttpError) {
                    res.writeHead(e.status, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: e.message, details: e.details }));
                }
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: e.toString() }));
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: "Not found" }));
        }
    });
    server.listen(port, "0.0.0.0");
    return server;
}

export class HttpError extends Error {
    constructor(public status: number, message: string, public details?: string) {
        super(message);
    }
}
import http from "http";
import https from "https";
import fs from 'fs';
import path from 'path';
import url from 'url';
import tls from 'tls';
import * as zlib from 'zlib';
// const nodeUrl = require('node:url');
import nodeUrl from "node:url";
import querystring from "querystring";
import { createCertificate } from "./ssl";
import { TlsCertificate } from "methods/tlsCertificate/TlsCertificate.model";


const maxContentLength = 25 * 1024 * 1024; // 25 MB

const cache = {};
// Function to get SSL certificate based on the domain
export async function getCertificate(domain) {
    domain = domain.replace(/^www\./, '');
    const cachedCert = cache[domain];
    if (cachedCert) {
        const certDetails = cachedCert.context.getCertificate();
        const certExpiry = new Date(certDetails.valid_to);
        const now = new Date();
        const oneHour = 60 * 60 * 1000;

        if (certExpiry.getTime() - now.getTime() > oneHour) {
            return cachedCert
        } else {
            delete cache[domain];
        }
    }

    let [tlsCert] = await TlsCertificate.fromQuery(`SELECT * FROM TlsCertificate WHERE domain=? AND privateKey IS NOT NULL`, [domain]);
    if (!tlsCert) {
        console.error("no tlss cert for ", domain);
        return null;
    }
    let certObj = tls.createSecureContext({ key: tlsCert.privateKey, cert: tlsCert.certificate });
    let certDetails = certObj.context.getCertificate();
    let certExpiry = new Date(certDetails.valid_to);
    let now = new Date();
    let oneHour = 60 * 60 * 1000;
    if (certExpiry.getTime() - now.getTime() < oneHour) {
        return null;
    }

    cache[domain] = certObj;
    return certObj;
}

async function handleComplete(fn, args, res: http.ServerResponse, req: http.IncomingMessage) {
    try {
        let returnValue = await fn(args);
        // check if headers already sent
        if (res.headersSent) {
            return;
        }
        if (!returnValue) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('');
        } else if (typeof returnValue === "string") {
            // zlib
            res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Encoding': 'gzip' });
            const gzip = zlib.createGzip();
            gzip.pipe(res);
            gzip.write(returnValue);
            gzip.end();
            // res.end(returnValue);
        } else {
            // zlib
            res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' });
            const gzip = zlib.createGzip();
            gzip.pipe(res);
            gzip.write(JSON.stringify(returnValue));
            gzip.end();

            // res.end(JSON.stringify(returnValue));
        }
    } catch (err) {
        console.error("Error handling request", err);
        console.error("path is", req.url);
        if (!res.headersSent && res.writable)
            res.writeHead(500, { 'Content-Type': 'text/plain' });
        // if not closed
        if (res.writable && !res.writableEnded) {
            console.log("writable");
            res.end('Internal server error.');
        }
    }
}

// Function to handle incoming requests
function handleRequest(req, res, callback) {
    try {
        console.log("Request received:", req.method, req.url);
        let bodyParts = [];
        let url = new URL(req.url, `http://${req.headers.host}${req.url}`);
        let host = req.headers.host.replace(/\:\d+$/, "");
        
        // if it's multipart, let each function handle it.
        if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/')) {
            return handleComplete(callback, { req, res, url, body: null, host }, res, req);
        }

        let body: any = null;
        // Check content type and content length
        if (!req.headers['content-length']) {
            return handleComplete(callback, { req, res, body, url, host }, res, req);
        } else if (req.headers['content-length'] && req.headers['content-length'] < maxContentLength) {
            req.on('data', chunk => {
                bodyParts.push(chunk);
                if (chunk.length > maxContentLength) {
                    req.destroy();
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end(`content length exceeded. max is ${maxContentLength / 1000 / 1000} MB`);
                }
            });

            req.on('end', () => {
                let body: any = Buffer.concat(bodyParts);
                if (req.headers['content-type'] === 'application/json') {
                    try {
                        body = JSON.parse(body);
                    } catch (err) {
                        console.error('Error parsing JSON:', err);
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end('Invalid JSON.');
                        return;
                    }
                } else if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                    try {
                        body = new URLSearchParams(body.toString());
                    } catch (err) {
                        console.error('Error parsing URL encoded form:', err);
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end('Invalid form data.');
                        return;
                    }
                }
                return handleComplete(callback, { req, res, body, url, host }, res, req);
            });

            req.on('error', err => {
                console.error('Error reading request:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error.');
            });
        } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end(`content length exceeded. max is ${maxContentLength / 1000 / 1000} MB`);
        }
    } catch (err) {
        console.error("Error handling request", err);
        console.error("path is", req.url);
        try {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
        } catch (err) {
            console.error("Error setting headers", err);
        }
        try {
            res.end('Internal server error.');
        } catch (err) {
            console.error("Error sending response", err);
        }
    }
};

export interface ServerParams { req: http.IncomingMessage, res: http.ServerResponse, body?: any, url: URL, host: string }
export async function createServer(useHttps: boolean, handler: (params: ServerParams) => void) {
    // Create HTTP server
    if (!useHttps)
        return http.createServer((req, res) => handleRequest(req, res, handler));
    else {
        // Create HTTPS server with SNI support
        return https.createServer({
            async SNICallback(domain, cb) {
                try {
                    let cert = await getCertificate(domain);
                    if (cert) {
                        cb(null, cert);
                    } else {
                        cb(new Error('No certificate found for domain'));
                    }
                } catch (err) {
                    console.error("Error handling SNI request:", err);
                    cb(err);
                }
            },
        }, (req, res) => handleRequest(req, res, handler));
    }
}
import { IncomingMessage, ServerResponse } from "http";
import { join, normalize } from "path";
import * as fs from "fs";
import { stat } from "fs/promises";
import * as zlib from "zlib";
import { readFile } from "fs/promises";
var mime = require('mime-types');

const MAX_CACHE_AGE = 0; //24 * 60 * 60; // 24 hours in seconds

export async function servePublic(req: IncomingMessage, res: ServerResponse<IncomingMessage>, url, publicDir) {
    console.log("req.url", req.url);
    let requestedPath = req.url.replace(/\.\./g, "");
    if (requestedPath === "/") {
        requestedPath = "/index.html";
    }
    let filePath = normalize(join(publicDir, requestedPath)).split("?")[0];
    if (!filePath.startsWith(publicDir)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Path is invalid" }));
        return;
    }
    console.log("trying to get file", filePath);

    try {
        let stats = await stat(filePath);

        const lastModified = stats.mtime.toUTCString();
        // const etag = `${stats.size}-${stats.mtime.getTime()}`;
        // md5
        // const content = await readFile(filePath);
        // const etag = require('crypto').createHash('md5').
        //     update(content).digest('hex');

        // // Check for If-Modified-Since and If-None-Match headers
        // const ifModifiedSince = req.headers['if-modified-since'];
        // const ifNoneMatch = req.headers['if-none-match'];

        // if (ifNoneMatch === etag || ifModifiedSince === lastModified) {
        //     console.log("sending 304", filePath);
        //     res.writeHead(304);
        //     res.end();
        //     return true;
        // }

        const acceptEncoding = req.headers['accept-encoding'] as string || '';
        let encoding = null;
        // if (/\bbr\b/.test(acceptEncoding)) {
        //     encoding = 'br';
        // } else
        if (/\bgzip\b/.test(acceptEncoding)) {
            encoding = 'gzip';
        } else if (/\bdeflate\b/.test(acceptEncoding)) {
            encoding = 'deflate';
        }

        let headers: any = {
            "Content-Type": mime.lookup(filePath) || "application/octet-stream",
            "Last-Modified": lastModified,
            // "ETag": etag,
            // "Cache-Control": `public, max-age=${MAX_CACHE_AGE}`,
        };

        if (encoding) {
            headers['Content-Encoding'] = encoding;
        } else {
            headers['Content-Length'] = stats.size;
        }
        console.log("writing headers 200", headers);
        res.writeHead(200, headers);

        const raw = fs.createReadStream(filePath);
        let stream;

        // if (encoding === 'br') {
        //     stream = raw.pipe(zlib.createBrotliCompress());
        // } else
        if (encoding === 'gzip') {
            stream = raw.pipe(zlib.createGzip({ level: 1 }));
        } else if (encoding === 'deflate') {
            stream = raw.pipe(zlib.createDeflate({ level: 1 }));
        } else {
            stream = raw;
        }

        await new Promise((resolve, reject) => {
            stream.on('error', (error: any) => {
                reject(error);
            });
            stream.pipe(res);
            stream.on('finish', resolve);
        });
        return true;
    } catch (error) {
        return false;
    }
}
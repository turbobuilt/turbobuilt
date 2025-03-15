import { Upload } from "methods/upload/Upload.model";
import db from "./db";
import { ServerParams } from "./node-server";

export async function serveImage(params: ServerParams, imgId?: string) {
    let { res, url } = params;
    let workspaceId = url.pathname.split("/")[1];
    let [upload] = await db.query(`SELECT * FROM Upload WHERE objectId = ? AND organization=(SELECT organization FROM Workspace WHERE guid=?)`, [imgId, workspaceId]);
    console.log(`SELECT * FROM Upload WHERE objectId = ? AND organization=(SELECT organization FROM Workspace WHERE guid=?)`, [imgId, workspaceId])
    if (!upload) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: "Image not found" }));
    }
    // return redirect
    // let path = Upload.getUploadKey(upload)
    let fullUrl = `https://clientsites.dreamgenerator.ai//${upload.guid}/${upload.cloudStorageName}`;

    res.writeHead(302, {
        'Location': fullUrl
    });
    res.end();
}
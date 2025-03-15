import db from "../../lib/db";
import { route } from "../../lib/server";
import { Upload } from "./Upload.model";
import { UploadUrlListByObjectResponse } from "./UploadUrlListByObjectResponse.model";

export default route(async function (params, objectIds: string[]) {
    if (!objectIds.length) {
        return {}
    }
    let uploads = await db.query(`SELECT * FROM Upload
        WHERE organization = ? AND objectId IN (${objectIds.map(_ => "?").join(",")})
        ORDER BY created DESC`, [params.organization.guid, ...objectIds]);

    uploads = uploads.map(item => {
        return {
            url: Upload.getUploadKey(item),
            ...item
        }
    });

    let map: UploadUrlListByObjectResponse = {};
    for (let item of uploads) {
        if (!map[item.objectId]) {
            map[item.objectId] = [];
        }
        map[item.objectId].push(item)
    }

    return { items: map };
});
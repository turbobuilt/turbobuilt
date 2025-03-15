import { HttpError, route } from "lib/server";
import { Upload } from "./Upload.model";
import { deleteUpload } from "lib/s3";
import db from "lib/db";


export default route(async function (params, uploadGuid: string) {
    let [upload] = await Upload.fetch(uploadGuid, params.organization.guid);
    if (!upload) {
        throw new HttpError(400, `That upload ${uploadGuid} wasn't found in this organization.`);
    }
    await deleteUpload(process.env.cloudflare_client_files_bucket, Upload.getUploadKey(upload));
    await db.query(`DELETE FROM Upload WHERE guid=? AND organization=?`, [upload.guid, upload.organization])
    return { upload };
});
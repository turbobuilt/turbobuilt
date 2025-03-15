import { HttpError, route } from "../../lib/server";
import { Upload } from "./Upload.model";

export default route(async function (params, clientUpload: Upload) {
    let [upload] = await Upload.fetch(clientUpload.guid, params.organization.guid);
    if (!upload) {
        throw new HttpError(400, "That upload wasn't found or isn't part of this organization. If this is an error, please contact support!");
    }

    try {
        upload.organization = params.organization.guid;
        upload.objectId = clientUpload.objectId;
        let result = await upload.save();
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            throw new HttpError(409, "workspace with that identifier already exists");
        }
        throw err;
    }
    return upload;
})
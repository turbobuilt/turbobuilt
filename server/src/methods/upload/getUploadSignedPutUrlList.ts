import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { Item } from "../item/Item.model";
import { getSignedPut } from "../../lib/s3";
import { Upload } from "./Upload.model";

const maxStorageSpace = 50 * 1024 * 1024;
const maxFileSize = 5 * 1024 * 1024;


export function makeRandomId(length: number = 10): string {
    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let id = "";
    for (let i = 0; i < length; i++) {
        id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
}

export function makeObjectIdFromDescription(description: string): string {
    return description.toLowerCase()
        .replace(/[^a-z0-9\s]+/g, '')
        .trim()
        .replace(/\s+/g, '-');
}
export interface UploadInformation { name: string, description?: string, contentType: string, size: number, metadata: any, objectId?: string };
export default route(async function (params, uploadInformation: UploadInformation[]) {
    if (uploadInformation.length > 20) {
        throw new HttpError(400, "You can only upload 20 items at a time right now. If this is too small please contact support.")
    }
    let totalSize = 0;
    for (let i = 0; i < uploadInformation.length; ++i) {
        if (uploadInformation[i].size > maxFileSize) {
            throw new HttpError(400, `File ${i + 1} is greater than the maximum of ${maxFileSize / 1024 / 1024}MB`)
        }
        if (!uploadInformation[i].size) {
            throw new HttpError(400, `There is no size for file ${i + 1}. This may mean it is an empty file, or there is no content. If you are sure it is a valid file, please contact support for help so we can fix the bug!`);
        }
        if (uploadInformation[i].name?.length > 200) {
            throw new HttpError(400, `File ${i + 1} has a name longer than 200 characters which is not permitted.`);
        }
        totalSize += uploadInformation[i].size;
    }
    let [totalBytesInfo] = await db.query(`SELECT SUM(size) as totalStorage FROM Upload WHERE organization=?`, [params.organization.guid]);

    if (parseInt(totalBytesInfo.totalStorage) + totalSize > maxStorageSpace) {
        throw new HttpError(400, `Uploading these files would put you over the max storage space for your account. Please upgrade or contact support for help! Please forgive us for the inconvenience we are trying very hard to make this a good product and need your help!`)
    }

    let uploadListData: { uploadUrl: string, accessUrl: string, upload: Upload }[] = await Promise.all(uploadInformation.map(async info => {
        let upload = new Upload();
        upload.organization = params.organization.guid;
        upload.size = info.size;
        upload.name = info.name;
        upload.metadata = info.metadata;
        upload.cloudStorageName = upload.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-_\.]/g, '').replace(/-{2,}/g, '-').replace(/_{2,}/g, '_');
        upload.contentType = info.contentType;
        upload.description = info.description;
        upload.objectId = info.objectId || makeObjectIdFromDescription(info.description) || makeRandomId();
        let uploadData = {
            uploadUrl: null,
            accessUrl: null,
            upload: upload
        };
        try {
            await uploadData.upload.save()
        } catch (err) { // try again if there is a duplicate key error
            uploadData.upload.objectId = uploadData.upload.objectId + "-" + makeRandomId(5);
            await uploadData.upload.save()
        }
        uploadData.uploadUrl = await getSignedPut(process.env.cloudflare_client_files_bucket, Upload.getUploadKey(uploadData.upload), uploadData.upload.contentType, uploadData.upload.size);
        uploadData.accessUrl = Upload.getUploadKey(upload)
        return uploadData;
    }));
    return uploadListData;
})
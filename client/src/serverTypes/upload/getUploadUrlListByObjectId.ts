import callMethod from "../../lib/callMethod";
import { UploadUrlListByObjectResponse } from "./UploadUrlListByObjectResponse.model";

export default function getUploadUrlListByObjectId(objectIds: string[]) {
    return callMethod("upload.getUploadUrlListByObjectId", [...arguments]) as Promise<{ error?: string, data: { items?: undefined; } | { items: import("/home/me/turbobuilt/server/src/methods/upload/UploadUrlListByObjectResponse.model").UploadUrlListByObjectResponse; } }>;
};

import callMethod from "../../lib/callMethod";
import { Upload } from "./Upload.model";

export default function getUploadSignedPutUrlList(uploadInformation: UploadInformation[]) {
    return callMethod("upload.getUploadSignedPutUrlList", [...arguments]) as Promise<{ error?: string, data: { uploadUrl: string; accessUrl: string; upload: import("/home/me/turbobuilt/server/src/methods/upload/Upload.model").Upload; }[] }>;
};

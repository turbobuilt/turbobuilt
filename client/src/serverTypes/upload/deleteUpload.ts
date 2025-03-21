import callMethod from "../../lib/callMethod";
import { Upload } from "./Upload.model";

export default function deleteUpload(uploadGuid: string) {
    return callMethod("upload.deleteUpload", [...arguments]) as Promise<{ error?: string, data: { upload: import("/home/me/turbobuilt/server/src/methods/upload/Upload.model").Upload; } }>;
};

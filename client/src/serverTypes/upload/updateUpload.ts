import callMethod from "../../lib/callMethod";
import { Upload } from "./Upload.model";

export default function updateUpload(clientUpload: Upload) {
    return callMethod("upload.updateUpload", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/upload/Upload.model").Upload }>;
};

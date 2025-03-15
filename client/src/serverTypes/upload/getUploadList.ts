import callMethod from "../../lib/callMethod";
                     
export default function getUploadList(options: { page: number, perPage: number }) {
    return callMethod("upload.getUploadList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};

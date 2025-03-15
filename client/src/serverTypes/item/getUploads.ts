import callMethod from "../../lib/callMethod";
                     
export default function getUploads(options: { page: number, perPage: number }) {
    return callMethod("item.getUploads", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};

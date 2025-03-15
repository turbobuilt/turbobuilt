import callMethod from "../../lib/callMethod";
                     
export default function bulkInsertPreview(rows: any[], headers: { text: string, itemPropertyType: string }[]) {
    return callMethod("item.bulkInsertPreview", [...arguments]) as Promise<{ error?: string, data: void }>;
};

import callMethod from "../../lib/callMethod";

export default function startItemImportTask(rows: any[], headers: { text: string, itemPropertyType: string }[], nameColumnIndex: number, selectedWebsite: string) {
    return callMethod("itemImportTask.startItemImportTask", [...arguments]) as Promise<{ error?: string, data: { items: { guid: any; }[]; itemImportTask: any; } }>;
};

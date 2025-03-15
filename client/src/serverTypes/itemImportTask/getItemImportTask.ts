import callMethod from "../../lib/callMethod";
                     
export default function getItemImportTask(guid: string) {
    return callMethod("itemImportTask.getItemImportTask", [...arguments]) as Promise<{ error?: string, data: any }>;
};

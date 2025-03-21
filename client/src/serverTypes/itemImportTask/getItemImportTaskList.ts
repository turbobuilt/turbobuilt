import callMethod from "../../lib/callMethod";

export default function getItemImportTaskList(options) {
    return callMethod("itemImportTask.getItemImportTaskList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};

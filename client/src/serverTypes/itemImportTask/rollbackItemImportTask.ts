import callMethod from "../../lib/callMethod";

export default function rollbackItemImportTask(guid: string) {
    return callMethod("itemImportTask.rollbackItemImportTask", [...arguments]) as Promise<{ error?: string, data: void }>;
};

import callMethod from "../../lib/callMethod";
                     
export default function saveWorkspaceFileName(guid, name: string) {
    return callMethod("workspaceFile.saveWorkspaceFileName", [...arguments]) as Promise<{ error?: string, data: { success: boolean; } }>;
};

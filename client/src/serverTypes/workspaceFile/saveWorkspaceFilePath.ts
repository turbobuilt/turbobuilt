import callMethod from "../../lib/callMethod";

export default function saveWorkspaceFilePath(guid, path: string) {
    return callMethod("workspaceFile.saveWorkspaceFilePath", [...arguments]) as Promise<{ error?: string, data: { success: boolean; } }>;
};

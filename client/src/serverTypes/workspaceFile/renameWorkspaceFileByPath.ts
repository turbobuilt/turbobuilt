import callMethod from "../../lib/callMethod";

export default function renameWorkspaceFileByPath(filePath: string, newFilePath: string) {
    return callMethod("workspaceFile.renameWorkspaceFileByPath", [...arguments]) as Promise<{ error?: string, data: { success: boolean; } }>;
};

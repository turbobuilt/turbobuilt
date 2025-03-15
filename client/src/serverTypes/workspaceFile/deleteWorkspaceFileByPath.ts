import callMethod from "../../lib/callMethod";
                     
export default function deleteWorkspaceFileByPath(filePath: string) {
    return callMethod("workspaceFile.deleteWorkspaceFileByPath", [...arguments]) as Promise<{ error?: string, data: { success: boolean; } }>;
};

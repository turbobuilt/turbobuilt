import callMethod from "../../lib/callMethod";
                     
export default function getWorkspaceFileByPath(filePath: string) {
    return callMethod("workspaceFile.getWorkspaceFileByPath", [...arguments]) as Promise<{ error?: string, data: ArrayBuffer }>;
};

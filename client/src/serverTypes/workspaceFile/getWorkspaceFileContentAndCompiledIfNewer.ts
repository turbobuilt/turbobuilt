import callMethod from "../../lib/callMethod";
                     
export default function getWorkspaceFileContentAndCompiledIfNewer(filePath: string, updated: string) {
    return callMethod("workspaceFile.getWorkspaceFileContentAndCompiledIfNewer", [...arguments]) as Promise<{ error?: string, data: Uint8Array[] & { exists: boolean; newContent?: boolean; } }>;
};

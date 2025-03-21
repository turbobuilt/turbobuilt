import callMethod from "../../lib/callMethod";

export default function getWorkspaceFileByPathCompiled(filePath: string) {
    return callMethod("workspaceFile.getWorkspaceFileByPathCompiled", [...arguments]) as Promise<{ error?: string, data: ArrayBuffer }>;
};

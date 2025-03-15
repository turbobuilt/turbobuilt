import callMethod from "../../lib/callMethod";
                     
export default function listDirectory(filePath) {
    return callMethod("workspaceFile.listDirectory", [...arguments]) as Promise<{ error?: string, data: { items: WorkspaceFile[]; } }>;
};

import callMethod from "../../lib/callMethod";

export default function createDirectory(filePath: string) {
    return callMethod("workspaceFile.createDirectory", [...arguments]) as Promise<{ error?: string, data: { guid: any; path: string; type: string; created: Date; updated: Date; } }>;
};

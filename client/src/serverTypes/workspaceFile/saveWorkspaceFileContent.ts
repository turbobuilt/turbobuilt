import callMethod from "../../lib/callMethod";

export default function saveWorkspaceFileContent(filePath, content, compiled, dependenciesJSON) {
    return callMethod("workspaceFile.saveWorkspaceFileContent", [...arguments], { useFormData: true }) as Promise<{ error?: string, data: { workspaceFile: { guid: string; updated: string; }; dependentComponents: any; mtime: any; } }>;
};

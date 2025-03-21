import callMethod from "../../lib/callMethod";

export default function searchWorkspaceFile(searchText: string, { page, perPage, workspaceGuid }) {
    return callMethod("workspaceFile.searchWorkspaceFile", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};

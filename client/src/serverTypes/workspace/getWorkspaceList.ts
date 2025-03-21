import callMethod from "../../lib/callMethod";

export default function getWorkspaceList() {
    return callMethod("workspace.getWorkspaceList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};

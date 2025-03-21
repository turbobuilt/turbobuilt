import callMethod from "../../lib/callMethod";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";

export default function saveWorkspaceFileMetadata(workspaceFile: WorkspaceFile) {
    return callMethod("workspaceFile.saveWorkspaceFileMetadata", [...arguments]) as Promise<{ error?: string, data: { workspaceFile: import("/home/me/turbobuilt/server/src/methods/workspace/WorkspaceFile.model").WorkspaceFile; } }>;
};

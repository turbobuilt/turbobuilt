import callMethod from "../../lib/callMethod";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";

export default function saveWorkspaceFileMetadata(workspaceFile: WorkspaceFile) {
    return callMethod("workspaceFile.saveWorkspaceFileMetadata", [...arguments]) as Promise<{ error?: string, data: { workspaceFile: WorkspaceFile; } }>;
};

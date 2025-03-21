import callMethod from "../../lib/callMethod";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";

export default function getWorkspaceFileList(workspaceGuid: string) {
    return callMethod("workspaceFile.getWorkspaceFileList", [...arguments]) as Promise<{ error?: string, data: { items: import("/home/me/turbobuilt/server/src/methods/workspace/WorkspaceFile.model").WorkspaceFile[]; } }>;
};

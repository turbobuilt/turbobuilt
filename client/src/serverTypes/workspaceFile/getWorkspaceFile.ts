import callMethod from "../../lib/callMethod";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";

export default function getWorkspaceFile(workspaceGuid: string, guid: string) {
    return callMethod("workspaceFile.getWorkspaceFile", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/workspace/WorkspaceFile.model").WorkspaceFile }>;
};

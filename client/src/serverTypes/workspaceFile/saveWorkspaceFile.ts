import callMethod from "../../lib/callMethod";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";

export default function saveWorkspaceFile(workspaceFile: WorkspaceFile, compiled: { js: string, css: string, path: string }) {
    return callMethod("workspaceFile.saveWorkspaceFile", [...arguments]) as Promise<{ error?: string, data: { workspaceFile: import("/home/me/turbobuilt/server/src/methods/workspace/WorkspaceFile.model").WorkspaceFile; } }>;
};

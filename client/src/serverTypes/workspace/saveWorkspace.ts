import callMethod from "../../lib/callMethod";
import { Workspace } from "./Workspace.model";

export default function saveWorkspace(clientWorkspace: Workspace) {
    return callMethod("workspace.saveWorkspace", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/workspace/Workspace.model").Workspace }>;
};

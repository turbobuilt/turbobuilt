import callMethod from "../../lib/callMethod";
import { Workspace } from "./Workspace.model";

export default function getWorkspace(guid: string) {
    return callMethod("workspace.getWorkspace", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/workspace/Workspace.model").Workspace }>;
};

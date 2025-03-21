import callMethod from "../../lib/callMethod";
import { Workspace } from "./Workspace.model";

export default function getDefaultWorkspace() {
    return callMethod("workspace.getDefaultWorkspace", [...arguments]) as Promise<{ error?: string, data: { workspace: import("/home/me/turbobuilt/server/src/methods/workspace/Workspace.model").Workspace; } }>;
};

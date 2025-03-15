import callMethod from "../../lib/callMethod";
import { Workspace } from "./Workspace.model";

export default function getDefaultWorkspace() {
    return callMethod("workspace.getDefaultWorkspace", [...arguments]) as Promise<{ error?: string, data: { workspace: Workspace; } }>;
};

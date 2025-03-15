import callMethod from "../../lib/callMethod";
import { Workspace } from "./Workspace.model";

export default function deleteWorkspace(guid: string) {
    return callMethod("workspace.deleteWorkspace", [...arguments]) as Promise<{ error?: string, data: Workspace }>;
};

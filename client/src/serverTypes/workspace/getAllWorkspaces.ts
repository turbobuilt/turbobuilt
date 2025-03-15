import callMethod from "../../lib/callMethod";
import { Workspace } from "./Workspace.model";

export default function getAllWorkspaces() {
    return callMethod("workspace.getAllWorkspaces", [...arguments]) as Promise<{ error?: string, data: Workspace[] }>;
};

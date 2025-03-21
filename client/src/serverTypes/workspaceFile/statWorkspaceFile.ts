import callMethod from "../../lib/callMethod";
import { FileStat } from "./statWorkspaceFile";

export default function statWorkspaceFile(filePath: string) {
    return callMethod("workspaceFile.statWorkspaceFile", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/workspaceFile/statWorkspaceFile").FileStat }>;
};

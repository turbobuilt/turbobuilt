import { DbObject } from "../DbObject.model";

export class WorkspaceFile extends DbObject {
    name?: string;
    type?: "file" | "dir";
    content?: Buffer;
    workspace?: string;
    organization?: string;
    parent?: string;
    compiledJs?: string;
    compiledCss?: string;
    pathParts?: string[];
    pathPart1?: string;
    pathPart2?: string;
    pathPart3?: string;
    pathPart4?: string;
    pathPart5?: string;
    compiled?: string | Buffer;
    path?: string;
}

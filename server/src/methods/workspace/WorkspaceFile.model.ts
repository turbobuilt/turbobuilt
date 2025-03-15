import { DbObject } from "../../lib/DbObject.model";
import { foreign, json, longText, mediumBlob, text, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";
import { Workspace } from "./Workspace.model";

export class WorkspaceFile extends DbObject {
    @varchar(255)
    name?: string;
    @varchar(255)
    type?: "file" | "dir";
    @mediumBlob()
    content?: Buffer;
    @foreign({ type: () => Workspace, onDelete: "cascade", onUpdate: "cascade", notNull: true })
    workspace?: string;
    @foreign({ type: () => Organization, onDelete: "cascade", onUpdate: "cascade", notNull: true })
    organization?: string;
    @foreign({ type: () => WorkspaceFile, onDelete: "cascade", onUpdate: "cascade", notNull: false })
    parent?: string;
    @longText()
    compiledJs?: string;
    @longText()
    compiledCss?: string;

    @json()
    pathParts?: string[];

    pathPart1?: string;
    pathPart2?: string;
    pathPart3?: string;
    pathPart4?: string;
    pathPart5?: string;

    @mediumBlob()
    compiled?: Buffer|string;

    @text()
    path?: string;

    // unsavedChanges: boolean;
}
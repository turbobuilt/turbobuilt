import { DbObject } from "lib/DbObject.model";
import { foreign, text, varchar } from "lib/schema";
import { Organization } from "methods/organization/Organization.model";
import { Workspace } from "methods/workspace/Workspace.model";
import { WorkspaceFile } from "methods/workspace/WorkspaceFile.model";

export class WorkspaceFileDependency extends DbObject {
    @foreign({ type: () => WorkspaceFile, onDelete: "cascade", onUpdate: "cascade", notNull: true })
    workspaceFile: string;
    
    @text()
    path: string;

    @text()
    importText: string;

    @foreign({ type: () => Workspace, onDelete: "cascade", onUpdate: "cascade", notNull: true })
    workspace: string;

    @foreign({ type: () => Organization, onDelete: "set null", onUpdate: "set null", notNull: true })
    organization: string;
}
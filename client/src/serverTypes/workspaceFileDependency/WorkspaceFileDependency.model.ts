export class WorkspaceFileDependency extends DbObject {
    workspaceFile: string;
    path: string;
    importText: string;
    workspace: string;
    organization: string;
}

import { WebsitePageTemplate } from "methods/websitePageTemplate/WebsitePageTemplate.model";
import { route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";

export default route(async function (params, workspaceFile: WorkspaceFile) {
    workspaceFile = await WorkspaceFile.init(workspaceFile, params.organization.guid);
    workspaceFile.organization = params.organization.guid;
    await workspaceFile.save();
    
    return { workspaceFile };
});
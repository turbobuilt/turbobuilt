import { WebsitePageTemplate } from "methods/websitePageTemplate/WebsitePageTemplate.model";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";

export default route(async function (params, guid, path: string) {
    let [workspaceFile] = await WorkspaceFile.fetch(guid, params.organization.guid);
    if (!workspaceFile) {
        throw new HttpError(400, `WorkspaceFile ${guid} was not found in the current organization.`)
    }
    await db.query(`UPDATE WorkspaceFile SET path = ?, pathParts = ?
         WHERE guid = ? AND organization = ?`, [path, path.split("/").slice(1), guid, params.organization.guid]);
    updateRelatedComponentsPath(workspaceFile, path)
    return { success: true };
});


async function updateRelatedComponentsPath(workspaceFile: WorkspaceFile, path) {
    let promises = [];
    let websitePageTemplates = await WebsitePageTemplate.fromQuery(`
SELECT * 
FROM WebsitePageTemplate
WHERE JSON_CONTAINS(content, JSON_OBJECT('component', JSON_OBJECT('guid', ?)), '$.blocks');`, [workspaceFile.guid]);
    console.log("matching pages length", websitePageTemplates.length)
    for (let websitePageTemplate of websitePageTemplates) {
        for (let block of websitePageTemplate.content.blocks) {
            if (block.component.guid === workspaceFile.guid) {
                block.component.path = path;
            }
        }
        promises.push(websitePageTemplate.save());
    }
    await Promise.all(promises);
}
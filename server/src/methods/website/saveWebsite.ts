import { WebsiteDomain } from "methods/websiteDomain/WebsiteDomain.model";
import { HttpError, route } from "../../lib/server";
import { Website } from "./Website.model";
import db from "lib/db";

export default route(async function (params, clientItem: Website) {
    let website = await Website.init(clientItem, params.organization.guid);
    if (!website.name) {
        throw new HttpError(400, "name is required");
    }
    let originalDomain = website.domain;
    let isNew = false;
    if (!website.guid) {
        isNew = true;
    }

    try {
        website.organization = params.organization.guid;
        let result = await website.save();
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            throw new HttpError(409, "workspace with that identifier already exists");
        }
        throw err;
    }

    if (!originalDomain && website.domain) {
        // create a folder
        await db.query(`INSERT INTO WorkspaceFile (guid, workspace, path, type, name, organization) VALUES (?, ?, ?, ?, ?, ?)`, [website.guid, website.guid, `/${website.domain}`, "folder", website.name, params.organization.guid]);
    } else if (originalDomain && originalDomain !== website.domain) {
        let [workspace] = await db.query(`SELECT guid FROM Workspace WHERE organization = ?`, [params.organization.guid]);
        let [workspaceFiles] = await db.query(`SELECT guid FROM WorkspaceFile WHERE workspace = ? AND path LIKE ?`, [workspace.guid, `/${originalDomain}/%`]);
        let promises = workspaceFiles.map(async (workspaceFile) => {
            workspaceFile.path = workspaceFile.path.replace(`/${originalDomain}`, `/${website.domain}`);
            await workspaceFile.save();
        });
        await Promise.all(promises);
    }

    return website;
})
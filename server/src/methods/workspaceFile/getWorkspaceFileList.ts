import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";


export default route(async function (params, workspaceGuid: string) {
    let items = await db.query(`SELECT guid, name, path, parent, type
        FROM WorkspaceFile 
        WHERE workspace = ? AND organization = ? ORDER BY path ASC`,
        [workspaceGuid, params.organization.guid]) as WorkspaceFile[];
    
    return { items };

    // items = getFiles(items, null);



    
    // let fileObjects = {};
    // let files = [];
    // for(let item of items) {
    //     let parts = item.path.split("/");
    //     let parent = fileObjects;
    //     for(let i = 0; i < parts.length - 1; i++) {
    //         let part = parts[i];
    //         if (!parent[part]) {
    //             parent[part] = { name: part, type: "dir", children: [] };
    //         }
    //         parent = parent[part].children;
    //     }
    //     parent.push({ name: parts[parts.length - 1], type: "file" });
    // }
    

    return { items };
});

// files: [
//     {
//         name: "folder 1", type: "dir", children: [
//             { name: "file 1.1", type: "file" },
//             { name: "file 1.2", type: "file" }
//         ]
//     },
//     {
//         name: "folder 2", type: "dir", children: [
//             {
//                 name: "folder 2.1", type: "dir", children: [
//                     { name: "file 2.1.1", type: "file" },
//                     { name: "file 2.1.2", type: "file" }
//                 ]
//             },
//             { name: "file 2.1", type: "file" },
//             { name: "file 2.2", type: "file" }
//         ]
//     },
//     { name: "file 3.vue", type: "file" },
//     { name: "file 4.vue", type: "file" }
// ]
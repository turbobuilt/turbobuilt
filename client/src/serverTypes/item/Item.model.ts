import { DbObject } from "../DbObject.model";

export class Item extends DbObject {
    name: string;
    organization: string;
    uploads: { upload: string; cloudStorageName: string; }[];
    addToAllSites: boolean;
    properties?: { name?: string; type?: { guid?: string; name?: string; }; value: any; }[];
}

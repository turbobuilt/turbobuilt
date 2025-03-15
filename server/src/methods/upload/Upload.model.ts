import { DbObject } from "../../lib/DbObject.model";
import { bigInt, bit, foreign, json, text, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";

export class Upload extends DbObject {
    static getUploadKey(upload: Upload) {
        return `${upload.guid}/${upload.cloudStorageName}`;    
    }

    @text()
    name: string;

    @bigInt()
    size: number;

    @bit()
    uploaded: boolean;

    @text()
    description: string;

    @text()
    cloudStorageName: string;

    @varchar(255)
    objectId?: string;

    @varchar(255)
    contentType: string;

    @json()
    metadata: any;

    @foreign({ type: () => Organization, notNull: true, onDelete: "cascade", onUpdate: "cascade" })
    organization: string;
}
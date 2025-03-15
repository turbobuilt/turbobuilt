import { DbObject } from "../DbObject.model";

export class Upload extends DbObject {
    name: string;
    size: number;
    uploaded: boolean;
    description: string;
    cloudStorageName: string;
    objectId?: string;
    contentType: string;
    metadata: any;
    organization: string;
}

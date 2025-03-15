import { DbObject } from "../DbObject.model";

export class ItemImportBackup extends DbObject {
    itemImport: string;
    tableName: string;
    data: any;
    organization: string;
}

import { DbObject } from "../DbObject.model";

export class ItemImportTask extends DbObject {
    rolledBack: boolean;
    recordsCount: number;
    completed: boolean;
    organization: string;
}

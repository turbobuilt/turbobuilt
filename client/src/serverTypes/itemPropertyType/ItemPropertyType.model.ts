import { DbObject } from "../DbObject.model";

export class ItemPropertyType extends DbObject {
    name: string;
    organization: string;
    inputComponent: string;
    inputComponentCompiledJs: string;
    inputComponentCompiledCss: string;
    builtIn: boolean;
}

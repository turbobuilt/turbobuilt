import { DbObject } from "../../lib/DbObject.model";
import { bit, foreign, json, text, varchar } from "../../lib/schema";
import { Item } from "../item/Item.model";
import { Organization } from "../organization/Organization.model";

export class ItemPropertyType extends DbObject {
    @varchar(255, { required: true })
    name: string;

    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    organization: string;

    @text()
    inputComponent: string;

    @text()
    inputComponentCompiledJs: string;

    @text()
    inputComponentCompiledCss: string;

    @bit()
    builtIn: boolean;
}
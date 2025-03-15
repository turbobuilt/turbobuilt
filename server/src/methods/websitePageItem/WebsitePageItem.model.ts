import { DbObject } from "../../lib/DbObject.model";
import { foreign, json, text } from "../../lib/schema";

export class WebsitePageItem extends DbObject {
    @foreign({ onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    websitePage: string;

    @foreign({ onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    item: string;

    @foreign({ onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    organization: string;
}
import { Upload } from "methods/upload/Upload.model";
import { DbObject } from "../../lib/DbObject.model";
import { bit, foreign, json, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";
import { User } from "../user/models/User.model";

export class Item extends DbObject {
    @varchar(255, { required: true })
    name: string;
    
    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    organization: string;

    @json()
    uploads: { upload: string, cloudStorageName: string }[]

    @bit()
    addToAllSites: boolean;

    properties?: { name?: string, type?: { guid?: string, name?: string }, value: any }[]

    getPrice?() {
        return parseFloat(this.properties.find(item => item.name.toLowerCase().trim() === 'price').value);
    }

    static parse(clientItem: Item) {
        let item = new Item();
        Object.assign(item, clientItem);
        return item;
    }
}
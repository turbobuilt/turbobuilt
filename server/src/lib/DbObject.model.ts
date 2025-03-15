import moment from "moment";
import { createGuid } from "./base58";
import db, { Db } from "./db";
import { manageSchema } from "./manageSchema";
import { classProps } from "./schema";

export class DbObject {
    guid?: string;
    created?: string;
    updated?: string;
    // createdBy?: string;
    // updatedBy?: string;

    static async init?<T extends DbObject>(this: new (...args: any[]) => T, data?: T, organization?: string): Promise<T> {
        if (data.guid && organization) {
            let [result] = await db.query(`SELECT guid FROM ${this.name} WHERE guid = ? AND organization = ?`, [data.guid, organization])
            if (!result) {
                throw new Error(`This ${this.name} does not exist in the organization "${organization}"`)
            }
        }
        return Object.assign(new this(), data);
    }

    // static async load?<T extends DbObject>(this: new (...args: any[]) => T) {
    //     if(!this.)

    static async fetch?<T extends DbObject>(this: new (...args: any[]) => T, guid?: string, organization?: string) {
        if (!guid) {
            throw new Error("guid is required");
        }
        let results = await db.query(`SELECT * FROM ${this.name} WHERE guid = ? ${organization ? 'AND organization = ?' : ''}`, organization ? [guid, organization] : [guid]);
        return results.map(result => {
            let obj = Object.assign(new this(), result);
            return obj as T;
        });
    }

    static async fromQuery?<T extends DbObject>(this: new (...args: any[]) => T, query: string, params: any[] = []) {
        let results = await db.query(query, params);
        return results.map(result => {
            let obj = Object.assign(new this(), result);
            return obj as T;
        });
    }

    async fetch?(guid: string) {
        let [result] = await db.query(`SELECT * FROM ${this.constructor.name} WHERE guid = ?`, [guid]);
        if (result.length === 0) {
            return null;
        }
        Object.assign(this, result[0]);
        return this;
    }

    async save?(options?: { con: Db }) {
        options = options || { con: db };
        let con = options.con;
        let data = Object.assign({}, this) as any;
        await manageSchema(data);
        let now = moment();
        delete data.created;
        data.updated = now.format("YYYY-MM-DD HH:mm:ss.SSSSSS");
        // data.created = data.created || sqlFormatDateTime(now);
        // data.updated = sqlFormatDateTime(now);
        // data.updatedBy = null;
        console.log("data", data);
        for (let key in data) {
            if (!classProps[this.constructor.name][key] && key !== 'guid') {
                console.log("deleting", key);
                delete data[key];
                continue;
            }
            if (classProps[this.constructor.name][key]?.type === 'bit') {
                if (data[key] === false || data[key] === 0 || data[key] === "false" || data[key] === "0") {
                    data[key] = 0;
                } else if (data[key] === true || data[key] === 1 || data[key] === "true" || data[key] === "1") {
                    data[key] = 1;
                }
            }
            if (typeof data[key] === 'undefined' || data[key] === null) {
                data[key] = null;
            } else if (data[key] instanceof Buffer) {
                
            } else if (typeof data[key] === 'object') {
                if (data[key] instanceof DbObject) {
                    data[key] = (data[key] as any).guid as any;
                } else if (data[key] instanceof Date) {
                    data[key] = sqlFormatDateTime(moment(data[key])) as any;
                } else {
                    data[key] = JSON.stringify(data[key]) as any;
                }
            }
        }
        if (data.guid) {
            await con.query(`UPDATE ${this.constructor.name} SET ? WHERE guid = ?`, [data, data.guid]);
        } else {
            // data.createdBy = null;
            data.guid = createGuid();
            let result = await con.query(`INSERT INTO ${this.constructor.name} SET ?`, data);
            this.guid = data.guid;
        }
        return this;
    }

    async delete?() {
        if (!this.guid) {
            throw new Error("guid is required");
        }
        await db.query(`DELETE FROM ${this.constructor.name} WHERE guid = ? AND organization = ?`, [this.guid, (this as any).organization]);
    }
}

function sqlFormatDateTime(dateTime: moment.Moment): string {
    return dateTime.format('YYYY-MM-DD HH:mm:ss.SSSSSS');
}
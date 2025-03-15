import { DbObject } from "../dbObject";

export interface GetManyOptions {
    perPage?: number;
    page?: number;
    orderBy?: "asc"| "desc";
    orderByDirection?: string;
}

export interface RelatedOptions {
    parent?: DbObject;
    key?: string;
    type?: () => DbObject;
}

export class Related<T> {
    parent: DbObject;
    key: string;
    constructor(options: RelatedOptions) {
        this.parent = options.parent;
        this.key = options.key;
    }

    getMany(options?: GetManyOptions) {
        console.log("options", options)
        return [] as T[];
    }
}

export class RelatedItems<T> extends Array {

}
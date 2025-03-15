import db from "./db";
import { DbObject } from "./DbObject.model";
import { addForeignKey, createColumn, createTable } from "./manageSchema";


// export function checkTableExists
let tableSchemas: any[] = null;
async function ensureTableExists(tableName) {
    if (process.env.NODE_ENV !== 'development')
        return;
    if (!tableSchemas) {
        tableSchemas = await db.query(`SELECT * FROM information_schema.tables`, tableName, { disableScanForChanges: true });
    }
    let table = tableSchemas.find((table) => table.TABLE_NAME === tableName);
    if (!table) {
        await createTable(tableName);
        tableSchemas = null;
    }
}

export interface ColumnProperties {
    type: "text" | "decimal" | "varchar" | "longText" | "bigInt" | "dateTime" | "guid" | "json" | "bit" | "date" | "time" | "mediumBlob";
    precision?: number;
    totalDigits?: number;
    decimalDigits?: number;
    size?: number;
    notNull?: boolean;
}
export const classProps = {} as { [tableName: string]: { [columnName: string]: ColumnProperties } };

// export function model() {
//     return function (target: any) {
//         console.log("model is being called", target, target.name, target.constructor?.name);
//     };
// }

let columnSchemas: { [tableName: string]: any[] } = {};
export async function ensureColumnExists(tableName: string, columnName: string, properties: ColumnProperties) {
    await ensureTableExists(tableName);
    if (!columnSchemas[tableName]) {
        columnSchemas[tableName] = await db.query(`SELECT * FROM information_schema.columns WHERE table_name = ?`, tableName, { disableScanForChanges: true });
    }
    let column = columnSchemas[tableName].find((column) => column.COLUMN_NAME === columnName);
    if (!column) {
        let sqlTypes = {
            text: () => "TEXT",
            decimal: () => `DECIMAL(${properties.totalDigits}, ${properties.decimalDigits})`,
            varchar: () => `VARCHAR(${properties.size})`,
            longText: () => "LONGTEXT",
            bigInt: () => "BIGINT",
            dateTime: () => `DATETIME(${properties.precision})`,
            guid: () => "VARCHAR(255) COLLATE utf8mb4_0900_bin",
            json: () => "JSON",
            bit: () => "TINYINT(1)",
            date: () => "DATE",
            time: () => `TIME(${properties.precision})`
        }
        return;
        await createColumn(tableName, columnName, sqlTypes[properties.type](), properties);
        columnSchemas[tableName] = null;
    }
}

let foreignKeySchemas: { [tableName: string]: any[] } = {};
let foreignKeyConstraints: { [tableName: string]: any[] } = {};
export async function ensureForeignKey(fromTable: string, fromColumn: string, toTable: string, toColumn: string, options: ForeignOptions) {
    await ensureTableExists(fromTable);
    await ensureTableExists(toTable);
    if (!foreignKeySchemas[fromTable]) {
        foreignKeySchemas[fromTable] = await db.query(`SELECT * FROM information_schema.key_column_usage WHERE table_name = ?`, fromTable, { disableScanForChanges: true });
    }
    let foreignKey = foreignKeySchemas[fromTable].find((column) => column.COLUMN_NAME === fromColumn);
    if (!foreignKey) {
        await addForeignKey(fromTable, fromColumn, toTable, toColumn, options);
        foreignKeySchemas[fromTable] = null;
    }
    // check if on delete and on update are correct
    if (!foreignKeyConstraints[fromTable]) {
        foreignKeyConstraints[fromTable] = await db.query(`SELECT * FROM information_schema.referential_constraints WHERE table_name = ?`, fromTable, { disableScanForChanges: true });
    }
    // let foreignKeyConstraint = foreignKeyConstraints[fromTable].find((column) => column.COLUMN_NAME === fromColumn);
    // if (foreignKeyConstraint) {
    //     if (foreignKeyConstraint.DELETE_RULE.toLowerCase() !== options.onDelete.toLowerCase()) {
    //         await db.query(`ALTER TABLE ${fromTable} DROP FOREIGN KEY ${foreignKeyConstraint.CONSTRAINT_NAME}`);
    //         await addForeignKey(fromTable, fromColumn, toTable, toColumn, options);
    //     }
    // }
}

// Define the decorator functions
export function text() {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "text" };
        ensureColumnExists(target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
    };
}

export function decimal({ totalDigits, decimalDigits }: { totalDigits: number, decimalDigits: number }) {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "decimal", totalDigits, decimalDigits };
        ensureColumnExists(target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
    };
}

export function bit() {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "bit" };
        ensureColumnExists(target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
    };
}

export interface VarcharOptions {
    required?: boolean
}
export function varchar(size: number, options: VarcharOptions = {}) {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "varchar", size, notNull: options.required };
        ensureColumnExists(target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
    };
}

export function json() {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "json" };
        ensureColumnExists(target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
    };
}

export function longText() {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "longText" };
        ensureColumnExists(target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
    };
}

export function mediumBlob() {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "mediumBlob" };
        ensureColumnExists(target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
    };
}

export function bigInt() {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "bigInt" };
        ensureColumnExists(target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
    };
}

export function dateTime({ precision }: { precision: number }) {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "dateTime", precision };
        ensureColumnExists(target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
    };
}

export function date() {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "date" };
        ensureColumnExists(target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
    };
}

export function time({ precision }: { precision: number }) {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "time", precision };
        ensureColumnExists(target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
    };
}

// interface RelatedOptions {
//     type?: () => DbObject
//     key: string
// }
// export function related(options: RelatedOptions) {
//     return function (target: any, propertyKey: string) {
//         (async () => {
//             classProps[target.constructor.name] = classProps[target.constructor.name] || {};
//             classProps[target.constructor.name][propertyKey] = options;
//         })();
//     }
// }

let camelToPascal = (str: string) => str[0].toUpperCase() + str.slice(1);

// accepts optional function returning a extends DbObject
interface ForeignOptions {
    type?: () => typeof DbObject
    onDelete: 'cascade' | 'restrict' | 'set null';
    onUpdate: 'cascade' | 'restrict' | 'set null';
    notNull: boolean
}
export function foreign<T extends DbObject>(options: ForeignOptions) {
    return function (target: any, propertyKey: string) {
        (async () => {
            // convert to uppercase
            options.onDelete = options.onDelete.toUpperCase() as any;
            options.onUpdate = options.onUpdate.toUpperCase() as any;
            await ensureTableExists(target.constructor.name);
            classProps[target.constructor.name] = classProps[target.constructor.name] || {};
            let foreignName = options.type ? (options.type() as any).name : camelToPascal(propertyKey);
            if (!foreignName) {
                throw new Error(`Error creating foreign key on ${target.constructor.name}.${propertyKey} - foreign key must be a class that extends DbObject, but it is ${foreignName}`);
            }
            if (!classProps[target.constructor.name][propertyKey]) {
                // throw new Error(`Error creating foreign key on ${target.constructor.name}.${propertyKey} to ${foreignName} - Column type annotation must come above/before @foreign() foreign key declaration`);
                // it must be a guid
                classProps[target.constructor.name][propertyKey] = { type: "guid" };
            }
            Object.assign(classProps[target.constructor.name][propertyKey], {
                type: "guid",
                foreign: foreignName,
                foreignOptions: options
            });
            // console.log("making columnh with foreign key", target.constructor.name, propertyKey, classProps[target.constructor.name][propertyKey]);
            await ensureColumnExists(target.constructor.name, propertyKey, { 
                ...classProps[target.constructor.name][propertyKey], 
                ...options.notNull as any
            });
            // console.log("making foreign key table", target.constructor.name, propertyKey, foreignName, "guid", options || {});
            await ensureTableExists(foreignName);
            // console.log("making foreign key", target.constructor.name, propertyKey, foreignName, "guid", options || {});
            await ensureForeignKey(target.constructor.name, propertyKey, foreignName, "guid", options);
        })();
    };
}

export function guid() {
    return function (target: any, propertyKey: string) {
        ensureTableExists(target.constructor.name);
        classProps[target.constructor.name] = classProps[target.constructor.name] || {};
        classProps[target.constructor.name][propertyKey] = { type: "guid" };
    };
}
import tsMorph, { ObjectLiteralExpression } from "ts-morph";
import db from "./db";
// import { confirm } from '@clack/prompts';
import { basename, join } from "path";
import moment from "moment";
import { migrations, runMigrations } from "../migrations";
import { classProps } from "./schema";
// import { createSelection } from 'bun-promptx'

// const addMigrationQueue = [];
export const addMigrationData = {
    queue: [],
    initialMigrationsComplete: false
}

export async function manageSchema(object) {
    if (process.env.NODE_ENV !== 'development')
        return;
    let tableName = object.constructor.name;

    // for(let prop of classProps[tableName]) {
    //     // check schema
    //     let tableSchema = await db.query(`SELECT * FROM information_schema.columns WHERE table_name = ? AND column_name = ?`, [tableName, prop], { disableScanForChanges: true });
    //     if (!tableSchema) {
    //         // add column
    //         let result = await addColumn(tableName, prop, object[prop]);
    //         if (result === false)
    //             return;
    //     }
    // }

    let dbExists = await db.query(`SELECT * FROM information_schema.tables WHERE table_name = ?`, tableName);
    if (!dbExists) {
        let result = await createTable(tableName);
        if (result === false)
            return;
    }

    // // make sure all column names are present
    // let columns = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = ?`, tableName);
    // let columnNames = columns.map(column => column.column_name);
    // console.log("columnNames", columnNames);
    // for(let key in object) {
    //     if (!columnNames.includes(key)) {
    //         let result = await addColumn(tableName, key, object[key]);
    //         if (result === false)
    //             return;
    //     }
    // }
}

export async function addColumn(tableName, key, value) {
    let result = await confirm(`Add column ${key} to table ${tableName}?`);
    if (!result)
        return false;
    let columnType = null;
    if (typeof value === 'string') {
        columnType = "VARCHAR(255)";
    } else if (typeof value === 'number' && parseInt(value as any) === value) {
        columnType = "BIGINT";
    } else if (typeof value === 'number') {
        columnType = "DOUBLE";
    } else if (typeof value === 'boolean') {
        columnType = "TINYINT(1)";
    } else if (value instanceof Date) {
        columnType = "DATETIME(6)";
    } else if (typeof value === 'object') {
        columnType = "JSON";
    }

    // check if column name is the name of another table
    let tableExists = await db.query(`SELECT * FROM information_schema.tables WHERE table_name = ?`, key);
    // if it is, it's a foreign key and is type VARCHAR(255) COLLATE utf8mb4_0900_bin NOT NULL and add foreign key
    if (tableExists) {
        columnType = "VARCHAR(255) COLLATE utf8mb4_0900_bin NOT NULL";
        let query = `ALTER TABLE ${tableName} ADD COLUMN ${key} ${columnType}, ADD FOREIGN KEY (${key}) REFERENCES ${key}(guid)`;
        addMigration(`add column ${key} to ${tableName}`, query);
        return true;
    }

    let query = `ALTER TABLE ${tableName} ADD COLUMN ${key} ${value}`;
    addMigration(`add column ${key} to ${tableName}`, query);
    return true;
}

export async function scanForNewTables(query, params) {
    if (process.env.NODE_ENV !== 'development')
        return;
    let tableNames = [];
    let results = query.matchAll(/select[^\(\)]*?\s+from\s+([a-zA-Z0-9_]+)/gi);
    for (let result of results) {
        tableNames.push(result[1]);
    }
    // find in joins
    results = query.matchAll(/join\s+([a-zA-Z0-9_]+)/gi);
    for (let result of results) {
        tableNames.push(result[1]);
    }
    // find in inserts
    results = query.matchAll(/insert\s+into\s+([a-zA-Z0-9_]+)/gi);
    for (let result of results) {
        tableNames.push(result[1]);
    }
    // find in updates
    results = query.matchAll(/update\s+([a-zA-Z0-9_]+)/gi);
    for (let result of results) {
        tableNames.push(result[1]);
    }
    // find in deletes
    results = query.matchAll(/delete\s+from\s+([a-zA-Z0-9_]+)/gi);
    for (let result of results) {
        tableNames.push(result[1]);
    }
    // remove system mysql tables
    tableNames = tableNames.filter(tableName => !tableName.match(/^mysql/));
    // remove information_schema and others
    tableNames = tableNames.filter(tableName => !tableName.match(/^information_schema/));

    let promises = [];
    for (let tableName of tableNames) {
        promises.push(db.query(`SELECT * FROM information_schema.tables WHERE table_name = ?`, tableName, { disableScanForChanges: true }));
    }

    let existsResults = await Promise.all(promises);
    let missingTables = tableNames.filter((tableName, index) => !existsResults[index].length);
    for (let tableName of missingTables) {
        let result = await createTable(tableName);
        if (result === false)
            return;
    }
}

export async function createTable(tableName) {
    let result = await confirm(`Create table ${tableName}?`);
    if (!result)
        return false;
    let query = `CREATE TABLE IF NOT EXISTS ${tableName} (guid VARCHAR(255) PRIMARY KEY COLLATE utf8mb4_0900_bin, created DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6), updated DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6))`;
    addMigration(`create table ${tableName}`, query);
    return true;
}
export async function createColumn(tableName, columnName, columnType, options) {
    let result = await confirm(`Create column ${columnName} in table ${tableName}?`);
    if (!result)
        return false;
    let notNull = options.notNull ? "NOT NULL" : "";
    let query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType} ${notNull}`.trim();
    addMigration(`add column ${columnName} to ${tableName}`, query);
    return true;
}
export async function addForeignKey(fromTable, fromColumn, toTable, toColumn, options) {
    let result = await confirm(`Add foreign key from ${fromTable}.${fromColumn} to ${toTable}.${toColumn}?`);
    if (!result)
        return false;
    let query = `ALTER TABLE ${fromTable} ADD FOREIGN KEY (${fromColumn}) REFERENCES ${toTable}(guid) ON DELETE ${options.onDelete} ON UPDATE ${options.onUpdate}`;
    addMigration(`add foreign key from ${fromTable}.${fromColumn} to ${toTable}.${toColumn}`, query);
    return true;
}

export async function addMigration(migrationName, migrationSql) {
    if(process.env.NODE_ENV !== 'development')
        return;
    // return;
    console.log("queuing migration", migrationSql);
    addMigrationData.queue.push({ migrationName, migrationSql });
    if (addMigrationData.initialMigrationsComplete) {
        await doMigrations();
    }
}

export async function doMigrations() {
    for (let i = 0; i < addMigrationData.queue.length; ++i) {
        let { migrationName, migrationSql } = addMigrationData.queue[i];
        try {
            let project = new tsMorph.Project();
            // add existing file src/migrations
            let sourceFile = project.addSourceFileAtPath(join(__dirname, "/../../src/migrations.ts"));
            // get statement 'export const migrations = { ... } and add the migration with key "auto_${moment().format('yyyy-mm-dd HH:mm:ssssss')}" and value query

            let migrations = sourceFile.getVariableDeclaration("migrations");
            let initializer = migrations.getInitializer() as ObjectLiteralExpression;
            if (!migrationName || initializer.getProperty(`"${migrationName}"`) || initializer.getProperty(`'${migrationName}'`)) {
                migrationName = (migrationName || '') + ` auto_${moment().utc().format('yyyy_mm_DD__HH_mm_sss')}__${Math.round(Math.random() * 1000000)}`;
                migrationName = migrationName.trim();
            }

            console.log("adding migration", migrationName, migrationSql);

            // initializer.addPropertyAssignment({ name: `'${migrationName}'`, initializer: `"${migrationSql}"` });
            // await sourceFile.save();
            // try {
            //     await db.execute(`INSERT INTO migrations (name) VALUES (?)`, [migrationName], { disableScanForChanges: true });
            //     // await db.execute(migrationSql, [], { disableScanForChanges: true });
            // } catch (err) {
            //     // remove it from the migration file
            //     initializer.getProperty(migrationName).remove();
            //     await sourceFile.save();
            //     console.error("error adding migration");
            //     console.error("Failed migration: ", migrationSql);
            //     console.error(err);
            //     await db.execute(`DELETE FROM migrations WHERE name = ?`, [migrationName], { disableScanForChanges: true });
            // }
        } catch (err) {
            console.error("error adding migration");
        } finally {
            addMigrationData.queue.splice(i, 1);
            --i;
        }
    }
}

export async function confirm(message) {
    console.log("confirmed", message);
    return true;
    // const result = await createSelection([
    //     { text: '', description: message },
    //     { text: '', description: "No" },
    // ], {
    //     headerText: message,
    //     perPage: 5,
    // })
    // return result.selectedIndex === 0;
}

export async function prompt(msg) {
    const prompt = "Type something: ";
    process.stdout.write(prompt);
    for await (const line of console) {
        console.log(`You typed: ${line}`);
        process.stdout.write(prompt);
    }
}
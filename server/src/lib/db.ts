import mysql from 'mysql2/promise';
import { createGuid } from './base58';
import { scanForNewTables } from './manageSchema';


export class Db {
    connection: mysql.Pool | mysql.PoolConnection;

    async connect() {
        this.connection = await mysql.createPool({
            host: process.env.mysqlHost,
            user: process.env.mysqlUser,
            password: process.env.mysqlPassword,
            database: process.env.mysqlDb,
            connectionLimit: 10,
            typeCast: function castField(field, useDefaultTypeCasting) {
                if (field.type === "TINY" && field.length === 1) {
                    return (field.string() === '1');
                }
                return useDefaultTypeCasting();
            }
        });
    }

    async query(statement, params?: any[] | any, options?: QueryOptions) {
        if (!this.connection)
            await this.connect();
        if (!options || !options.disableScanForChanges)
            await scanForNewTables(statement, params);
        if (process.env.NODE_ENV !== "production" && statement.indexOf("information_schema") === -1 && (!options || !options.log)) {
            // log
            // console.log("Query", mysql.format(statement, params));
        }
        // conver array to json
        for (let i = 0; i < params?.length; ++i) {
            if (Array.isArray(params[i])) {
                params[i] = JSON.stringify(params[i]);
            }
        }
        let [results] = await this.connection.query(statement, params);
        return results as any[];
    }

    async execute(statement, params?: any[], options?: QueryOptions) {
        if (!this.connection)
            await this.connect();
        if (!options || !options.disableScanForChanges)
            await scanForNewTables(statement, params);
        let [results] = await this.connection.execute(statement, params);
        return results as any[];
    }

    async transaction<T>(callback: (db: Db) => Promise<any>) {
        let tempDb = new Db();
        let conn = await (this.connection as mysql.Pool).getConnection();
        tempDb.connection = conn;
        await conn.beginTransaction();
        try {
            let result = await callback(db);
            await conn.commit();
            return result;
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    }

    async close() {
        await this.connection.end();
    }

    async createGuid() {
        return createGuid();
    }
}

class QueryOptions {
    disableScanForChanges: boolean;
    log?: boolean;
}
const db = new Db();

export default db;
import db from "lib/db";
import { route } from "../../lib/server";
import batteries2024 from "./batteries-2024";
import { BatteryInfo } from "./BatteryInfo.model";
import mysql from "mysql2";
import { createGuid } from "lib/base58";

export async function importBatteries() {
    let [result] = await db.query(`SELECT * FROM BatteryInfo LIMIT 1`);
    if (result)
        return;
    for (let make in batteries2024) {
        console.log("doing make", make)
        let promises = [];
        for (let model in batteries2024[make]) {
            for (let record of batteries2024[make][model]){
                let years = record.year.split("-");
                let endYear = parseInt(years[0]);
                let startYear = parseInt(years[1] ? years[1].length === 2 ? "20" + years[1] : years[1] : years[0]);
                for (var year = startYear; year <= endYear; ++year) {
                    let carIdentifier = `${year} ${make} ${model} ${record.engine}`.trim();
                    promises.push(db.query(`INSERT INTO BatteryInfo (guid, carIdentifier, bciGroup, cca) VALUES (
                        ${mysql.escape(await createGuid())},
                        ${mysql.escape(carIdentifier)},
                        ${mysql.escape(record.group)},
                        ${mysql.escape(record.cca)}
                    ) ON DUPLICATE KEY UPDATE bciGroup=bciGroup, cca=cca`), [], { log: false })
                }
            }
        }
        await Promise.all(promises);
    }
}

export default route(async function (params, query: string) {
    let results = await db.query(`SELECT carIdentifier FROM BatteryInfo WHERE carIdentifier LIKE ? LIMIT 10`, [query + "%"]);

    return { results };
}, { public: true });

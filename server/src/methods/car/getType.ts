import db from "lib/db";
import { route } from "../../lib/server";
import mysql from "mysql2";


export default route(async function (params, query: string) {
    let [count] = await db.query(`SELECT COUNT(*) as total FROM BatteryInfoQuery WHERE ipAddress=? AND created > DATE_SUB(NOW(), INTERVAL 1 HOUR)`, [params.requestIp]);
    if (count.total > 10) {
        return null;
    }
    
    let items = await db.query(`
        SELECT Item.*
        FROM Item
        JOIN ItemProperty ON (ItemProperty.name = 'group' AND ItemProperty.item = Item.guid)
        JOIN BatteryInfo ON (ItemProperty.value->>'$.value' = BatteryInfo.bciGroup)
        JOIN ItemProperty ccaProp ON (ccaProp.name = 'cca' AND CAST(ccaProp.value->>'$.value' AS SIGNED) >= BatteryInfo.cca AND ccaProp.item = Item.guid)
        WHERE BatteryInfo.carIdentifier = ?
        LIMIT 10;`, [query]);
    let quantity = 1;
    if (items.length) {
        let [data] = await db.query(`SELECT quantity FROM BatteryInfo WHERE carIdentifier=?`, [query]);
        quantity = data?.quantity || 1;
    }

    console.log("items are", items)
    return { items, quantity };
}, { public: true });

import { Website } from "methods/website/Website.model";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { OrderData } from "./OrderData.model";
import { getDomain } from "lib/getDomain";



export default route(async function (params, clientOrderData: any) {
    let orderData = new OrderData();
    Object.assign(orderData, clientOrderData);

    orderData.organization = params.organization.guid;
    let [website] = await Website.fromQuery(`SELECT * FROM Website WHERE organization=? AND isTest=1`, [params.organization.guid])

    if (!website) {
        website = await Website.init({ domain: getDomain(), organization: params.organization.guid, activated: false, name: "Test", isTest: true }), params.organization.guid;
        await website.save();
    }


    orderData.website = website.guid;

    if (orderData.guid) {
        let [existingOrderData] = await OrderData.fromQuery(`SELECT * 
            FROM OrderData 
            WHERE Website=? AND guid=?
        `, [website.guid, orderData.guid]);
        if (existingOrderData) {
            await orderData.save();
            return orderData;
        } else {
            console.log("order data not found");
            delete orderData.guid;
            await orderData.save();
            return orderData;
        }
    } else {
        await orderData.save();
        return orderData;
    }

    // if (order.email) {
    //     let [existingOrder] = await OrderData.fromQuery(`SELECT OrderData.*
    //         FROM OrderData
    //         WHERE website=? AND email=? AND 
    //         ORDER BY created desc
    //     `, [website.guid, order.email]);
    //     // if (existingOrder) {
    //     //     await db.query(`DELETE FROM OrderData WHERE guid=?`)
    //     // }
    // }
    await orderData.save();
    return orderData;
});

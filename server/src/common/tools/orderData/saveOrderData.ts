import { OrderData } from "../../../../../client/src/serverTypes/orderData/OrderData.model"

export default async function (orderData: OrderData) {
    if (typeof window !== "undefined") {
        localStorage.setItem("orderData", JSON.stringify(orderData));
        const { default: callMethod } = await import ("../../../../../client/src/lib/callMethod");
        let result = await callMethod("orderData.publicSaveOrderData", [orderData]);
        if (!result.error) {
            orderData.guid = result.data.guid;
        }
        return result;
    } else {
        
    }    
    return orderData;
}
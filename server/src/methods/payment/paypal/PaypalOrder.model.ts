import { DbObject } from "lib/DbObject.model";
import { json, varchar } from "lib/schema";
import { OrderData } from "methods/orderData/OrderData.model";

export class PaypalOrder extends DbObject {
    @varchar(30)
    paypalId: string;

    @varchar(30)
    status: string;

    @json()
    payload?: any;

    @json()
    orderData?: OrderData;

    // @json();
    // links: any;
}
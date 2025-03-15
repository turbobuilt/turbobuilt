export class PaypalOrder extends DbObject {
    paypalId: string;
    status: string;
    payload?: any;
    orderData?: OrderData;
}

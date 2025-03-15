import callMethod from "../../../lib/callMethod";
                     
export default function createPaypalOrder(orderData: OrderData) {
    return callMethod("payment.paypal.createPaypalOrder", [...arguments]) as Promise<{ error?: string, data: any }>;
};

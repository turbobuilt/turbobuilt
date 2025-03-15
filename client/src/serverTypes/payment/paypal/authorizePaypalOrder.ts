import callMethod from "../../../lib/callMethod";
                     
export default function authorizePaypalOrder(orderID: string) {
    return callMethod("payment.paypal.authorizePaypalOrder", [...arguments]) as Promise<{ error?: string, data: any }>;
};

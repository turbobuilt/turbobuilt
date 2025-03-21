import callMethod from "../../../lib/callMethod";

export default function capturePaypalOrder(orderID: string) {
    return callMethod("payment.paypal.capturePaypalOrder", [...arguments]) as Promise<{ error?: string, data: any }>;
};

import cart from "./cart/index";
import customer from "./customer/index";
import { getQueryParameters, getRouteParameters } from "./getPathInfo";
import item from "./item/index";
import money from "./money/index";
import orderData from "./orderData/index";
import paypal from "./paypal/index";
import upload from "./upload/index";
import util from "./util/index";
import callMethod from "./callMethod";
import server from "./server/index";
import internal from "./internal/index"
import stripe from "./stripe/index";

const data = {
    cart,
    customer,
    item,
    orderData,
    paypal,
    upload,
    money,
    util,
    server,
    callMethod,
    getQueryParameters,
    getRouteParameters,
    internal,
    stripe
}
if (typeof window !== "undefined")
    (window as any).turbobuiltTools = data;
if (typeof global !== "undefined")
    (global as any).turbobuiltTools = data;

export default data;
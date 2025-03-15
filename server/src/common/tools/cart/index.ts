import addToCart from "./addToCart";
import clearCart from "./clearCart";
import getCart from "./getCart";
import getLineItemTotal from "./totals/getLineItemTotal";
import { getTotalItemsCount } from "./getTotalItemsCount";
import getUrlCart from "./getUrlCart";
import isInCart from "./isInCart";
import removeFromCart from "./removeFromCart";
import saveCart from "./saveCart";
import totals from "./totals/index";

export default {
    addToCart,
    clearCart,
    getCart,
    getUrlCart,
    removeFromCart,
    saveCart,
    totals,
    getTotalItemsCount,
    isInCart,
    getLineItemTotal
}
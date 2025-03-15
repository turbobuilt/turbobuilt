import { route } from "lib/server";
import { Purchase } from "./Purchase.model";
import { getHydratedItems, hydrateCart } from "methods/item/publicGetItemList";

export default route(async function (params, guid) {
    let [purchase] = await Purchase.fromQuery(`
        SELECT Purchase.*
        FROM Purchase
        WHERE Purchase.guid = ? AND Purchase.organization = ?`,
        [guid, params.organization.guid]);

    if (!purchase) {
        throw new Error("Purchase not found");
    }

    await hydrateCart(purchase.organization, purchase.cart);

    return { purchase };
});

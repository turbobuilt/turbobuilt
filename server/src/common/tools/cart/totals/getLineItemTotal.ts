import { ShoppingCartLineItem } from "../cart";

export default function(lineItem: ShoppingCartLineItem) {
    let sum = 0;
    let priceProp = lineItem.item.properties.find(prop => prop.name === "PriceTable");
    let tiers = priceProp?.value?.data?.tiers || [];
    let remainingQuantity = lineItem.quantity || 0;
    for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        let tierCount = tier.quantity !== null ? Math.min(remainingQuantity, tier.quantity) : remainingQuantity;
        sum += tierCount * tier.price;
        remainingQuantity -= tierCount;
        if (remainingQuantity <= 0 || tier.quantity === null) break;
    }
    return sum;
}
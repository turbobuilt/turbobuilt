import { HydratedClientItem } from "../cart/cart";

export default function(item: HydratedClientItem, name) {
    return item.properties.find(prop => prop.name.toLowerCase() === name.toLowerCase());
}
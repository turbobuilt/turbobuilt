import callMethod from "../../lib/callMethod";
import { ItemImage } from "./ItemImage.model";

export default function saveItemImage(clientItemImage: ItemImage) {
    return callMethod("itemImage.saveItemImage", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/itemImage/ItemImage.model").ItemImage }>;
};

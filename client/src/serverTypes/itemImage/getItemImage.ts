import callMethod from "../../lib/callMethod";
import { ItemImage } from "./ItemImage.model";

export default function getItemImage(guid: string) {
    return callMethod("itemImage.getItemImage", [...arguments]) as Promise<{ error?: string, data: ItemImage }>;
};

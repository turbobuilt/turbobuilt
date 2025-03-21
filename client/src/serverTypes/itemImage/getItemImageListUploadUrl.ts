import callMethod from "../../lib/callMethod";
import { ItemImage } from "./ItemImage.model";

export default function getItemImageListUploadUrl(itemGuid, imageInformation: { name: string, contentType: string, size: number }[]) {
    return callMethod("itemImage.getItemImageListUploadUrl", [...arguments]) as Promise<{ error?: string, data: { uploadUrl: string; itemImage: import("/home/me/turbobuilt/server/src/methods/itemImage/ItemImage.model").ItemImage; }[] }>;
};

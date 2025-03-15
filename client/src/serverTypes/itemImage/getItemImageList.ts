import callMethod from "../../lib/callMethod";
                     
export default function getItemImageList(options) {
    return callMethod("itemImage.getItemImageList", [...arguments]) as Promise<{ error?: string, data: { itemimages: any[]; } }>;
};

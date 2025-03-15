import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { Item } from "../item/Item.model";
import { ItemImage } from "./ItemImage.model";
import { getSignedPut } from "../../lib/s3";

const maxStorageSpace = 50 * 1024 * 1024;
const maxImageSize = 1024 * 1024;

export default route(async function (params, itemGuid, imageInformation: { name: string, contentType: string, size: number }[]) {
    let [item] = await Item.fetch(itemGuid, params.organization.guid);
    if (!item) {
        throw new HttpError(400, "That item does not exist, or is not a part of your current organization. Please switch to the correct organization or contact support if this is an issue.");
    }
    if (imageInformation.length > 5) {
        throw new HttpError(400, "You can only upload 5 images at a time right now. If this is too small please contact support.")
    }
    let totalSize = 0;
    for (let i = 0; i < imageInformation.length; ++i) {
        if (imageInformation[i].size > maxImageSize) {
            throw new HttpError(400, `Image ${i + 1} is greater than the maximum of ${maxImageSize / 1024 / 1024}MB`)
        }
        if (!imageInformation[i].size) {
            throw new HttpError(400, `There is no size for image ${i + 1}. This may mean it is an empty file, or there is no content. If you are sure it is a valid file, please contact support for help so we can fix the bug!`);
        }
        totalSize += imageInformation[i].size;
    }
    let [totalBytesInfo] = await db.query(`SELECT SUM(size) as totalStorage FROM ItemImage WHERE organization=?`, [params.organization.guid]);
    if (totalBytesInfo.totalStorage + totalSize > maxStorageSpace) {
        throw new HttpError(400, `Uploading these images would put you over the max storage space for your account. Please upgrade or contact support for help! Please forgive us for the inconvenience we are trying very hard to make this a good product and need your help!`)
    }
    let itemImageListData: { uploadUrl: string, itemImage: ItemImage }[] = [];
    for (let info of imageInformation) {
        let newItemImage = new ItemImage();
        newItemImage.organization = params.organization.guid;
        newItemImage.item = itemGuid;
        newItemImage.size = info.size;
        newItemImage.name = info.name;
        newItemImage.contentType = info.contentType;
        itemImageListData.push({
            uploadUrl: null,
            itemImage: newItemImage
        });
    }
    await Promise.all(itemImageListData.map(itemImageData => itemImageData.itemImage.save()));
    await Promise.all(itemImageListData.map(async itemImageData => {
        itemImageData.uploadUrl = await getSignedPut(process.env.cloudflare_client_files_bucket, itemImageData.itemImage.guid, itemImageData.itemImage.contentType, itemImageData.itemImage.size);
    }));
    return itemImageListData;
})
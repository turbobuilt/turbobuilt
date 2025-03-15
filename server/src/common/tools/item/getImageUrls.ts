import callMethod from "../../../../../client/src/lib/callMethod";

export default function(item) {
    // uploadData: { upload, cloudStorageName }
    for (let property of item.properties) {
        if (property?.type?.name === "Images") {
            let urls = [];
            for(let valueItem of property?.value?.value) {
                urls.push(`https://clientsites.dreamgenerator.ai/${valueItem.upload}/${valueItem.cloudStorageName}`)
            }
            return urls;
        }
    }
    return [];
}
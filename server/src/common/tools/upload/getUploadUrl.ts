import callMethod from "../../../../../client/src/lib/callMethod";

export default function(upload) {
    return `https://clientsites.dreamgenerator.ai/${upload.guid}/${upload.cloudStorageName}`;
}
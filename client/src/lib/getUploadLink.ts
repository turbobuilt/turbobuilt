import { Upload } from "@/serverTypes/upload/Upload.model";

export function getUploadLink(upload: Upload) {
    return `https://clientsites.dreamgenerator.ai/${upload.guid}/${upload.cloudStorageName}`;
}
import { Upload } from "./Upload.model";

export class UploadUrlListByObjectResponse {
    [objectId: string]: (Upload & { url: string })[]
}
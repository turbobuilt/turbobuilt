import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";
import { serverMethods } from "@/lib/serverMethods";
import { showAlert } from "./ShowModal/showModal";
import { uploadFilePut } from "@/lib/uploadFile";

export async function uploadGeneratedFile(file, shortDescription, prompt, provider, model, onProgress?: (progressPercent: number) => void) {
    let result = await serverMethods.upload.getUploadSignedPutUrlList([{
        contentType: file.type,
        name: file.name,
        size: file.size,
        description: shortDescription,
        metadata: {
            prompt,
            model,
            provider
        }
    }]);
    if (checkAndShowHttpError(result)) {
        return;
    }
    let uploadsInfo = result.data;
    for (let i = 0; i < uploadsInfo.length; ++i) {
        let info = uploadsInfo[i];
        let result = await uploadFilePut(file, info.uploadUrl, (percentComplete) => {
            onProgress?.(percentComplete);
        });
        if (result.error) {
            showAlert(`Error with upload ${i + 1} ${info.upload.name.slice(0, 25)} ` + result.error.toString());
            return;
        }
    }
    console.log("result is", result.data)
    return result.data[0];
}
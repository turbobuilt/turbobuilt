import callMethod from "../../../../../client/src/lib/callMethod";
import uploadFilePut from "./uploadFilePut";

interface ProgressData {
    percent: number,
    preparing: boolean,
    files: {
        percent: number,
        done: boolean,
        file: File,
        size: number,
        uploadedBytes: number
    }[];
}

export default async function uploadFiles(files: File[], onProgress: (progressData: ProgressData) => void) {
    let progress: ProgressData = {
        percent: 0,
        preparing: true,
        files: files.map(file => ({
            file: file,
            percent: null,
            uploadedBytes: 0 as number,
            size: file.size as number,
            done: false
        }))
    }
    function updateProgress() {
        let percent = 0;
        let totalSize = 0;
        let totalTransferred = 0;
        let done = true;
        for(let file of progress.files) {
            totalSize += file.size || 0;
            totalTransferred += file.uploadedBytes || 0;
            if (!file.done)
                file.done = false;
        }
        progress.percent = parseFloat((totalTransferred / totalSize).toFixed(3))
    }

    onProgress(progress);
    let result = await callMethod("upload.getUploadSignedPutUrlList", files.map(file => {
        return {
            contentType: file.type,
            name: file.name,
            size: file.size
        }
    }));
    if (result.error) {
        alert(result.error);
        return;
    }
    progress.preparing = false;
    onProgress(progress);
    let uploadsInfo = result.data;
    for (let i = 0; i < uploadsInfo.length; ++i) {
        let info = uploadsInfo[i];
        let result = await uploadFilePut(files[i], info.uploadUrl, (percentComplete) => {
            progress.files[i].percent = parseFloat(percentComplete.toFixed(2));
            updateProgress();
        });
        if (result.error) {
            alert(`Error with upload ${i + 1} ${info.upload.name.slice(0, 25)} ` + result.error.toString());
            return;
        }
        progress.files[i].percent = 100;
        progress.files[i].done = true;
        updateProgress();
    }
    progress.percent = 100;
    updateProgress();
    return result.data.map(uploadData => ({
        upload: uploadData.upload.guid,
        cloudStorageName: uploadData.upload.cloudStorageName
    }));
}
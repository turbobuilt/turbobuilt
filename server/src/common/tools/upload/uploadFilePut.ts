
export default function uploadFilePut(file, presignedUrl, onProgress: (percentComplete: number) => void): Promise<{ error?: any, data?: any }> {
    return new Promise((resolve, reject) => {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', presignedUrl, true);

            xhr.upload.onprogress = function (event) {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            };

            xhr.onload = function () {
                if (xhr.status.toString().startsWith("2")) {
                    resolve({ data: xhr.responseText });
                } else {
                    resolve({ error: xhr.responseText })
                }
            };

            xhr.onerror = function (event) {
                resolve({ error: `Error: ${event.type}, Status: ${xhr.status}, Status Text: ${xhr.statusText}` })
            };

            xhr.send(file);
        } catch (err) {
            resolve({ error: err })
        }
    });
}


export async function resizeImages(files: File[]) {
    let resizedFiles: File[] = [];
    for (let file of files) {
        let data = await getImageData(file);
        console.log("data is", data)
        let width = data.width;
        let height = data.height;
        let dimensions = getDimensions(data.width, data.height, 1920*2, 1920*2);
        // @ts-ignore
        const resizer = await import('https://cdn.jsdelivr.net/npm/@jsquash/resize@2.1.0/index.min.js');
        let resized = await resizer.default(data, dimensions);
        let blob = await convertImageToWebP(resized);

        let newFile = new File([blob], file.name.replace(/\.[^\.]{3,4}$/g, ".webp"), { type: blob.type });
        resizedFiles.push(newFile);
    }
    return resizedFiles;
}
export async function convertImageToWebP(imageData: ImageData) {
    const webp = await import("https://unpkg.com/@jsquash/webp@1.2.0?module");
    const webpBuffer = await webp.encode(imageData, {quality: 75});
    return new Blob([webpBuffer], { type: 'image/webp' });
}
function getDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
  return { width: originalWidth * ratio, height: originalHeight * ratio };
}
export async function getImageData(file: File) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    let img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(resolve => img.onload = resolve);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}
import { getSignedPut } from "lib/s3";
import { route } from "lib/server";
import { makeObjectIdFromDescription, makeRandomId } from "methods/upload/getUploadSignedPutUrlList";
import { Upload } from "methods/upload/Upload.model";
import OpenAI from 'openai';
import fetch from "node-fetch";
import { readFile } from "fs/promises";
import { fal } from "@fal-ai/client";


export default route(async function (params, apiKey, provider, model, imagePrompt, shortDescription): Promise<Buffer> {
    
    if (provider === "fal") {
        fal.config({
            credentials:apiKey
        });
        model = "fal-ai/flux/schnell"
        let promise = fal.subscribe(model, {
            input: {
                prompt: imagePrompt,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map((log) => log.message).forEach(console.log);
                }
            },
        });
        process.env.FAL_KEY = undefined;
        const result = await promise;
        console.log(result.data);
        console.log(result.requestId);
        let url = result.data.images[0].url;
        // download it
        const response = await fetch(url);
        const imageBuffer = await response.arrayBuffer();
        // write raw image to response
        params.res.writeHead(200, {
            'Content-Type': result.data.images[0].content_type,
            'Content-Length': imageBuffer.byteLength
        });
        params.res.write(Buffer.from(imageBuffer));
        params.res.end();
        return;
    } else if (provider === "openai") {

        const client = new OpenAI({ apiKey });
        const stream = await client.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
        });

        const imageB64 = stream.data[0].b64_json;
        const imageBuffer = Buffer.from(imageB64, 'base64');

        // write raw image to response
        params.res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': imageBuffer.length
        });
        params.res.write(imageBuffer);
        params.res.end();
        return;
    } else {
        throw new Error("Unknown provider: " + provider);
    }
    return;
    return imageBuffer;

    const upload = new Upload();
    upload.organization = params.organization.guid;
    upload.size = imageBuffer.length;
    upload.name = shortDescription || "generated-image.png";
    upload.metadata = { prompt: imagePrompt, shortDescription };
    upload.cloudStorageName = upload.name
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9\-_\.]/g, '')
        .replace(/-{2,}/g, '-')
        .replace(/_{2,}/g, '_');
    upload.contentType = "image/png";
    upload.description = shortDescription;
    upload.objectId = makeObjectIdFromDescription(shortDescription) || makeRandomId();

    try {
        await upload.save();
    } catch (err) {
        upload.objectId = upload.objectId + "-" + makeRandomId(5);
        await upload.save();
    }

    const uploadUrl = await getSignedPut(
        process.env.cloudflare_client_files_bucket,
        Upload.getUploadKey(upload),
        upload.contentType,
        upload.size
    );

    await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": upload.contentType,
            "Content-Length": String(imageBuffer.length),
        },
        body: imageBuffer,
    });

    // return { upload };
}, { streamResponse: true });
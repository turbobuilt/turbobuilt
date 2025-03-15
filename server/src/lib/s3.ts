import { PutObjectCommand, GetObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import moment from "moment";

const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.cloudflare_s3_endpoint,
    credentials: {
        accessKeyId: process.env.cloudflare_s3_key_id,
        secretAccessKey: process.env.cloudflare_s3_secret,
    },
});

export async function getSignedPut(bucket: string, key: string, contentType: string, fileSize: number) {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: fileSize,
    });

    return getSignedUrl(s3Client, command, {
        signableHeaders: new Set(["content-type", "content-length"]),
        expiresIn: 5 * 60, // 5 minutes
    });
}

export async function getSignedGet(bucket: string, key: string) {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    return getSignedUrl(s3Client, command, {
        expiresIn: 5 * 60, // 5 minutes
    });
}

// Function to delete an object from S3
export async function deleteUpload(bucket: string, key: string) {
    const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    try {
        await s3Client.send(command);
        console.log(`Successfully deleted ${key} from ${bucket}`);
    } catch (error) {
        console.error(`Error deleting ${key} from ${bucket}:`, error);
        throw error; // Rethrow the error after logging it
    }
}

export async function deleteUploadOrNotExists(bucket: string, key: string) {
    const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    try {
        await s3Client.send(command);
        console.log(`Successfully deleted ${key} from ${bucket}`);
        return { success: true, message: `Successfully deleted ${key} from ${bucket}` };
    } catch (error) {
        if (error.name === 'NoSuchKey') {
            // If the object does not exist, return success
            console.log(`Object ${key} not found in ${bucket}.`);
            return { success: true, message: `Object ${key} not found in ${bucket}.` };
        } else {
            console.error(`Error deleting ${key} from ${bucket}:`, error);
            throw error; // Rethrow the error for other issues
        }
    }
}

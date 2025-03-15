import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames

const execPromise = promisify(exec);

export default async function (req, res, params) {
    // Generate unique filenames to prevent conflicts when processing multiple requests
    const uniqueId = uuidv4();
    const inputFilePath = path.join('/tmp', `input-${uniqueId}.mp3`);
    const outputFilePath = path.join('/tmp', `output-${uniqueId}.opus`);
    
    try {
        // Get the MP3 data from params.body and write to temp file
        await fs.promises.writeFile(inputFilePath, params.body);
        
        // Build the FFmpeg command
        const ffmpegCommand = `ffmpeg -i "${inputFilePath}" -c:a libopus -b:a 32k -ac 1 "${outputFilePath}"`;
        
        // Execute FFmpeg
        await execPromise(ffmpegCommand);
        
        // Read the output file
        const opusData = await fs.promises.readFile(outputFilePath);
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'audio/opus');
        res.setHeader('Content-Disposition', 'attachment; filename="transcoded.opus"');
        
        // Send the transcoded data as the response
        return res.send(opusData);
    } catch (error) {
        console.error('Transcoding error:', error);
        return res.status(500).send({ error: 'Failed to transcode audio file' });
    } finally {
        // Clean up temporary files
        try {
            if (fs.existsSync(inputFilePath)) {
                await fs.promises.unlink(inputFilePath);
            }
            if (fs.existsSync(outputFilePath)) {
                await fs.promises.unlink(outputFilePath);
            }
        } catch (cleanupError) {
            console.error('Error cleaning up temporary files:', cleanupError);
        }
    }
}
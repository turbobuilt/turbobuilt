import { IncomingMessage } from 'http';

interface Options {
    maxBodySize: number;
}

interface FormData {
    [key: string]: any;
}

export function parseMultipartFormData(req: IncomingMessage, options: Options): Promise<Buffer[]> {
    return new Promise((resolve, reject) => {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.startsWith('multipart/form-data')) {
            reject(new Error('Invalid content-type'));
            return;
        }
        // check content-length header
        const contentLength = req.headers['content-length'];
        if (contentLength && parseInt(contentLength) > options.maxBodySize) {
            reject(new Error(`Content-Length exceeds the limit of ${options.maxBodySize}`));
            return;
        }

        const boundaryMatch = contentType.match(/boundary=(.+)$/);
        if (!boundaryMatch) {
            reject(new Error('No boundary found in content-type'));
            return;
        }
        const boundary = '--' + boundaryMatch[1];

        let data = '';
        let bodySize = 0;

        req.on('data', (chunk) => {
            bodySize += chunk.length;
            if (bodySize > options.maxBodySize) {
                req.destroy();
                reject(new Error(`Body exceeds the limit of ${options.maxBodySize}`));
                return;
            }
            data += chunk.toString('binary');
        });

        req.on('end', () => {
            const parts = data.split(boundary).slice(1, -1);
            const args = [];

            for (const part of parts) {
                const [headerPart, bodyPart] = part.split('\r\n\r\n');
                if (!headerPart || !bodyPart) continue;

                const headers = headerPart.split('\r\n');
                const contentDisposition = headers.find((h) => h.startsWith('Content-Disposition'));
                if (!contentDisposition) continue;

                const nameMatch = contentDisposition.match(/name="([^"]+)"/);
                if (!nameMatch) continue;
                const name = nameMatch[1];

                const value = bodyPart.slice(0, -2); // Remove trailing \r\n
                // formData[name] = value;
                // push buffer
                args.push(Buffer.from(value, 'binary'));
            }

            resolve(args);
        });

        req.on('error', (err) => {
            reject(err);
        });
    });
}
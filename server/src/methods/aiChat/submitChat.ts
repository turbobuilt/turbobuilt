import { route } from "lib/server";
import OpenAI from 'openai';

export default route(async function (params, apiKey, provider, model, messages) {
    try {
        // // Ensure system instruction is included
        // if (!messages.some((m: any) => m.role === "system")) {
        //     messages.unshift({
        //         role: "system",
        //         content: "When generating your response, first provide any comments then include a delimiter 'FILE_START' followed by the updated file content."
        //     });
        // }
        const client = new OpenAI({ apiKey });
        const stream = await client.chat.completions.create({
            model,
            messages,
            stream: true,
        });

        params.res.writeHead(200, { 'Transfer-Encoding': 'chunked' });
        params.res.flushHeaders();
        let buffer = "";
        for await (const chunk of stream) {
            const length = chunk.choices[0]?.delta?.content?.length || 0;
            params.res.write(`M ${length} ` + (chunk.choices[0]?.delta?.content || ''));
            buffer += chunk.choices[0]?.delta?.content || '';
        }
        params.res.end();
    } catch (err) {
        // console.error("Error in chat completion:", err);
        // params.res.writeHead(500, { 'Content-Type': 'text/plain' });
        // params.res.end("Internal Server Error");
    }
}, { streamResponse: true });
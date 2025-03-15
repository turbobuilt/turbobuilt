import callMethod from "../../lib/callMethod";

export default function generateImage(apiKey, provider, model, imagePrompt, shortDescription) {
    return callMethod("aiChat.generateImage", [...arguments], { streamResponse: true }) as Promise<{ error?: string, data: Buffer }>;
};

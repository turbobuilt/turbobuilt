import callMethod from "../../lib/callMethod";

export default function submitChat(apiKey, provider, model, messages) {
    return callMethod("aiChat.submitChat", [...arguments], { streamResponse: true }) as Promise<{ error?: string, data: void }>;
};

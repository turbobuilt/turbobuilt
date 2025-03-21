import callMethod from "../../lib/callMethod";

export default function getUploadsForDisplay(guids: string[]) {
    return callMethod("upload.getUploadsForDisplay", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};

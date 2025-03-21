import callMethod from "../../lib/callMethod";

export default function getItemImages(options: { page: number, perPage: number }) {
    return callMethod("item.getItemImages", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};

import callMethod from "../../lib/callMethod";

export default function publicGetItemList(criteria: Criteria, extra?: Extra) {
    return callMethod("item.publicGetItemList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};

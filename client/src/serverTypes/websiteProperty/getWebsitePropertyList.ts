import callMethod from "../../lib/callMethod";

export default function getWebsitePropertyList(options) {
    return callMethod("websiteProperty.getWebsitePropertyList", [...arguments]) as Promise<{ error?: string, data: { itemProperties: any[]; } }>;
};

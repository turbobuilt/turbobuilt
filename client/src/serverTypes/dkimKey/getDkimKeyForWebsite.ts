import callMethod from "../../lib/callMethod";

export default function getDkimKeyForWebsite(websiteGuid) {
    return callMethod("dkimKey.getDkimKeyForWebsite", [...arguments]) as Promise<{ error?: string, data: {} }>;
};

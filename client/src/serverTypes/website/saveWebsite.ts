import callMethod from "../../lib/callMethod";
import { Website } from "./Website.model";

export default function saveWebsite(clientItem: Website) {
    return callMethod("website.saveWebsite", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/website/Website.model").Website }>;
};

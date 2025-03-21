import callMethod from "../../lib/callMethod";
import { Website } from "./Website.model";

export default function getWebsite(guid: string) {
    return callMethod("website.getWebsite", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/website/Website.model").Website }>;
};

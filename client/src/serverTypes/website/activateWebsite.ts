import callMethod from "../../lib/callMethod";
import { Website } from "./Website.model";

export default function activateWebsite(guid: string) {
    return callMethod("website.activateWebsite", [...arguments]) as Promise<{ error?: string, data: import("/Users/me/prj/smarthost/server/src/methods/website/Website.model").Website }>;
};

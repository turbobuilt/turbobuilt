import callMethod from "../../lib/callMethod";
import { WebsiteProperty } from "./WebsiteProperty.model";

export default function getWebsiteProperty(guid: string) {
    return callMethod("websiteProperty.getWebsiteProperty", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/websiteProperty/WebsiteProperty.model").WebsiteProperty }>;
};

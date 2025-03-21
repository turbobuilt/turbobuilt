import callMethod from "../../lib/callMethod";
import { WebsiteProperty } from "./WebsiteProperty.model";

export default function deleteWebsiteProperty(guid: string) {
    return callMethod("websiteProperty.deleteWebsiteProperty", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/websiteProperty/WebsiteProperty.model").WebsiteProperty }>;
};

import callMethod from "../../lib/callMethod";
import { WebsiteProperty } from "./WebsiteProperty.model";

export default function saveWebsiteProperty(clientWebsiteProperty: WebsiteProperty) {
    return callMethod("websiteProperty.saveWebsiteProperty", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/websiteProperty/WebsiteProperty.model").WebsiteProperty }>;
};

import callMethod from "../../lib/callMethod";
import { WebsiteProperty } from "./WebsiteProperty.model";

export default function saveWebsitePropertyList(itemGuid: string, clientWebsitePropertyList: WebsiteProperty[], websiteGuid?: string) {
    return callMethod("websiteProperty.saveWebsitePropertyList", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/websiteProperty/WebsiteProperty.model").WebsiteProperty[] }>;
};

import callMethod from "../../lib/callMethod";
import { WebsiteProperty } from "./WebsiteProperty.model";

export default function getWebsiteProperty(guid: string) {
    return callMethod("websiteProperty.getWebsiteProperty", [...arguments]) as Promise<{ error?: string, data: WebsiteProperty }>;
};

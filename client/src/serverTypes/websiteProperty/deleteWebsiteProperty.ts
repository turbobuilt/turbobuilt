import callMethod from "../../lib/callMethod";
import { WebsiteProperty } from "./WebsiteProperty.model";

export default function deleteWebsiteProperty(guid: string) {
    return callMethod("websiteProperty.deleteWebsiteProperty", [...arguments]) as Promise<{ error?: string, data: WebsiteProperty }>;
};

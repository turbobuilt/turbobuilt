import callMethod from "../../lib/callMethod";
import { WebsiteProperty } from "./WebsiteProperty.model";

export default function saveWebsiteProperty(clientWebsiteProperty: WebsiteProperty) {
    return callMethod("websiteProperty.saveWebsiteProperty", [...arguments]) as Promise<{ error?: string, data: WebsiteProperty }>;
};

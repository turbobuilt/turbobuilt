import callMethod from "../../lib/callMethod";
import { WebsiteProperty } from "./WebsiteProperty.model";

export default function getWebsitePropertiesForWebsite(options: { page: number, perPage: number }, websiteGuid: string) {
    return callMethod("websiteProperty.getWebsitePropertiesForWebsite", [...arguments]) as Promise<{ error?: string, data: { websiteProperties: WebsiteProperty[]; } }>;
};

import callMethod from "../../lib/callMethod";
import { Organization } from "./Organization.model";

export default function deleteOrganization(guid: string) {
    return callMethod("organization.deleteOrganization", [...arguments]) as Promise<{ error?: string, data: import("/Users/me/prj/smarthost/server/src/methods/organization/Organization.model").Organization }>;
};

import { route } from "lib/server";
import { AppleSettings } from "./AppleSettings.model";

export default route(async function (params, appleDomainAssociationFile: string) {
    if (typeof appleDomainAssociationFile !== "string") {
        throw new Error("appleDomainAssociationFile must be a string");
    }
    if (appleDomainAssociationFile.length > 20000) {
        throw new Error("appleDomainAssociationFile is too long, contact support for help.");
    }
    // save the file
    let [appleSettings] = await AppleSettings.fromQuery(`SELECT * FROM AppleSettings WHERE organization = ?`, [params.organization.guid]);
    if (!appleSettings) {
        appleSettings = new AppleSettings();
        appleSettings.organization = params.organization.guid;
        await appleSettings.save();
    }
    appleSettings.appleDomainAssociationFile = appleDomainAssociationFile;
    await appleSettings.save();

    return { success: true };
});
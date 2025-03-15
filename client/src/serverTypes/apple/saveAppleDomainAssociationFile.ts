import callMethod from "../../lib/callMethod";
                     
export default function saveAppleDomainAssociationFile(appleDomainAssociationFile: string) {
    return callMethod("apple.saveAppleDomainAssociationFile", [...arguments]) as Promise<{ error?: string, data: { success: boolean; } }>;
};

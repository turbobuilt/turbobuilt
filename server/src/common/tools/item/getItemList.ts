// import callMethod from ;

import callMethod from "../../../../../client/src/lib/callMethod";

export default async function (criteria: { guids: string[], websitePageIdentifier?: string }) {
    console.log("criteria are", criteria)
    if (typeof window !== "undefined") {
        let result = await callMethod("item.publicGetItemList", [criteria]);
        return result;
    } else {
        
    }
}
import callMethod from "../../../../../client/src/lib/callMethod";

export async function getType(query) {
    return await callMethod("car.getType", [query]);
}
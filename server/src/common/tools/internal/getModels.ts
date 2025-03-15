import callMethod from "../../../../../client/src/lib/callMethod";

export async function getModels(query) {
    return await callMethod("car.getModels", [query]);
}
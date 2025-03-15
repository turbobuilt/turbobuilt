/**
 * Retrieves query parameters from the URL and returns them as an object.
 * If executing in a test environment, you can provide a custom test value 
 * to be returned instead. If the function is being run within a 
 * `window.parent` context, it bypasses retrieving URL parameters and 
 * returns any provided test value, or `undefined` if none is provided.
 *
 * @param {Object} [testValue] - Optional. A custom object to return when the 
 * function runs in a test environment or within a `window.parent`.
 * @returns {Object} An object representing the query parameters as key-value 
 * pairs. If a parameter appears multiple times, its values are stored in an 
 * array.
 *
 * @example
 * // Assuming the current URL is "http://example.com/?name=John&age=30"
 * const params = getQueryParams();
 * console.log(params); // { name: "John", age: "30" }
 *
 * // For multiple occurrences of the same key
 * // URL: "http://example.com/?name=John&name=Jane"
 * const params = getQueryParams();
 * console.log(params); // { name: ["John", "Jane"] }
 *
 * @example
 * // Providing a test value
 * const testParams = { foo: "bar" };
 * const params = getQueryParams(testParams);
 * console.log(params); // { foo: "bar" }
 */
export function getQueryParameters(data: { testValue: any } = { testValue: undefined }) {
    const { testValue } = data;
    if (window.parent) {
        return testValue;
    }
    let queryString = window.location.href.split("?")[1]
    if (!queryString)
        return {};
    let parts = queryString.split("&");
    let result = {};
    for (let part of parts) {
        let [key, value] = part.split("=")
        key = decodeURIComponent(key);
        value = decodeURIComponent(value || "");
        if (result[key]) {
            if (!Array.isArray(result[key]))
                result[key] = [result[key]];
            result[key].push(value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

export function getRouteParameters(options: { testValues?: any } = {}) {
    if (window.location.hostname === "portal.turbobuilt.com" || window.location.hostname ==='smarthost.co' || window.location.hostname === "localhost") {
        return options.testValues;
    }
    return (window as any).routeParameters
}

// export default function getPathInfo(testValues?: { query?: any, routeParameters?: any }) {
//     if (window.location.hostname === "portal.turbobuilt.com" || window.location.hostname ==='smarthost.co') {
//         return testValues;
//     }
//     return {
//         query: getQueryParams(),
//         routeParameters: (window as any).routeParameters
//     }
// }
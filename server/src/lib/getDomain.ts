
export function getDomain() {
    if (process.env.NODE_ENV === "production") {
        return "portal.turbobuilt.com";
    } else if (process.env.NODE_ENV === "staging") {
        return "staging.turbobuilt.com";
    } else {
        return "smarthost.co";
    }
}
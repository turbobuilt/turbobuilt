// import { store } from "../store";



export default async function callMethod(method: string, args: any[], options: { baseUrl?: string, workspaceGuid?: string, useFormData?: boolean, streamResponse?: boolean } = {}): Promise<{ error?: string, data?: { [key: string]: any }, type?: "binary" | "multibinary" }> {
    let headers = {
        "Content-Type": "application/json",
    } as any;
    let baseUrl = "/function";
    if (typeof window !== "undefined") {
        if (window.location.hostname === "portal.turbobuilt.com" || window.location.origin.replace(/:\d+/,"").endsWith("smarthost.co")  || window.location.origin.replace(/:\d+/,"").endsWith("localhost")) {
            baseUrl = "/api/method";
            try {
                let { store } = await import("../store");
                if (store.authToken) {
                    headers["Authorization"] = store.authToken;
                    headers["Organization-Id"] = store.userState?.currentOrganization || (typeof _website !== "undefined" && _website.organization) || "";
                } else {
                }
            } catch (err) {

            }
            headers["Organization-Id"] = headers["Organization-Id"] || (typeof _website !== "undefined" && _website.organization)
            headers["Authorization"] = headers["Authorization"] || (typeof _authToken !== "undefined" && _authToken);
        } else {
        }
    }

    if (options.baseUrl) {
        baseUrl = options.baseUrl;
    }

    let response: Response;
    try {
        // if any params are a blob or uint8array, use formdata
        // console.trace("Options formdata is", options.useFormData, method)
        if (options.useFormData) {
            let formData = new FormData();
            console.log("Form data args", args)
            args.forEach((arg, i) => {
                if (arg instanceof Uint8Array) {
                    formData.append("arg_" + i, new Blob([arg]));
                } else if (arg instanceof Blob) {
                    formData.append("arg_" + i, arg);
                } else if (typeof arg === "string") {
                    formData.append("arg_" + i, arg);
                } else {
                    formData.append("arg_" + i, JSON.stringify(arg));
                }
            });
            delete headers["Content-Type"];
            headers["method-name"] = method;
            response = await fetch(`${baseUrl}?debug=` + encodeURIComponent(method), {
                method: "POST",
                headers,
                body: formData,
                credentials: "same-origin",
            });
        } else {
            response = await fetch(`${baseUrl}?debug=` + encodeURIComponent(method), {
                method: "POST",
                headers,
                body: JSON.stringify({ method, args, workspaceGuid: options.workspaceGuid }),
                credentials: "same-origin",
            });
        }
    } catch (e) {
        return { error: "Network Error, you may be offline. Details: " + e.toString() };
    }

    if (!response.ok) {
        try {
            let json = await response.json();
            return { error: json.error };
        } catch (e) { }
        try {
            let text = await response.text();
            return { error: text };
        } catch (e) { }
        return { error: "Error, please contact support! " + response.statusText };
    }
    // check if content type is binary
    if (response.headers.get("content-type") === "application/octet-stream") {
        console.log("returning blob")
        let parts = [];

        if (response.headers.get("part-1-length")) {
            let data = new Uint8Array(await response.arrayBuffer());
            let parts = [];
            for (let i = 1; i <= 1_000_000; i++) {
                let header = response.headers.get("part-" + i + "-length");
                if (!header) {
                    break;
                }
                let length = parseInt(header);
                parts.push(new Uint8Array(data.slice(0, length)));
                data = data.slice(length);
            }
            return { data: parts, type: "multibinary" };
        }

        let result = { data: new Uint8Array(await response.arrayBuffer()), type: "binary" };
        console.log("blob result", result)
        return result as any
    }
    if (options.streamResponse) {
        return { data: response };
    }
    try {
        let json = await response.json();
        return json;
    } catch (e) {
        console.error(e);
        let text: string;
        try {
            text = await response.text();
            return { error: "Error parsing JSON: " + text };
        } catch (e) {
            return { error: "Error, please contact support! " + e.toString() };
        }
    }
}
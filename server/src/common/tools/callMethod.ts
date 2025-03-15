import callMethod from "../../../../client/src/lib/callMethod";

export default async function(methodName: string, args: any[]) {
    console.log("THIS IS", this)
    return callMethod(methodName, args, { baseUrl: "/client-api/method", workspaceGuid: this.workspaceGuid });
    // if (["localhost","portal.turbobuilt.com"].includes(window.location.hostname)) {
    //     return callMethod(methodName, args);
    // } else {

    // }
}
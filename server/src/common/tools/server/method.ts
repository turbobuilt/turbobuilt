declare var setResult: any;

export default async function(handler: (params: any) => any) {
    try {   
        console.log("set result is ", setResult)
        let result = await handler({});
        let processedResult = "";
        let contentType = "";
        if (typeof result === "object") {
            processedResult = JSON.stringify(result);
            contentType = "application/json"
        } else if (result.toString) {
            processedResult = result.toString();
        } else if (result === undefined) {
            result = "";
        } else {
            result = "";
        }
        setResult({ result: processedResult, contentType })
    } catch (err) {
        console.error(err);
        setResult(JSON.stringify({ error: "Error " + err.stack }))
    }
}
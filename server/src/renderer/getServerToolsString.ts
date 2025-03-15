import { readFile } from "fs/promises";

export async function getServerToolsString() {
    let toolsSrc = "";
    if (process.env.NODE_ENV === "development") {
        const { generateTools } = await import("../generateTools");
        let result = await generateTools();
        toolsSrc = result.outputFiles[0].text;
    } else {
        toolsSrc = await readFile("build/tools.js", "utf-8");
    }
    return toolsSrc;
}
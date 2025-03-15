import Bun from "bun";
import { getQuickJS } from "quickjs-emscripten"
import { createCertificate } from "./ssl";


async function main() {
    await createCertificate(["test.turbobuilt.com"]);
    // Bun.serve({
    //     fetch(req) {
    //         return new Response("Bun!");
    //     },
    // });
}
main();
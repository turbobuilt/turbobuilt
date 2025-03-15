import "./lib/startup";
import db from "./lib/db";
import { startServer } from "./lib/server";
import { runMigrations } from "./migrations";
import { handleRedirectRequest as handleHttpRequest, startRendererServer } from "./renderer/rendererServer";
import { createServer } from "./lib/node-server";
import { ensureMainSsl } from "./lib/mainSsl";
import { importBatteries } from "methods/car/getModels";
import { ensureBuiltInItemPropertyTypes } from "methods/itemPropertyType/getItemPropertyTypeList";
import { startTlsRenewalCron, tlsRenewal } from "lib/tlsRenewal";
import { runMethodPrivate } from "./client-api/runMethodPrivate"

async function main() {
    // await sendEmail({ to: ["dtruelson@icloud.com"], from: "test@turbobuilt.com", subject: "test email",  html: "<div>Test email</div>", text: "test email"});
    // return;
    console.log("Environment is:", process.env.cloudflare_client_files_bucket);
    console.log("Connecting to db");

    await db.connect();
    console.log("Running migrations");
    await runMigrations();
    console.log("Starting server");
    await ensureBuiltInItemPropertyTypes();
    importBatteries();

    // await runMethodPrivate(`import path from "path"; console.log(path);`, {}, {});
    
    
    if (process.env.NODE_ENV === "development") {
        var server = await startServer({ port: 8081, https: false });
        console.log(`Web App server started on http://smarthost.co:8081`);
    } else {
        var httpServer = await createServer(false, handleHttpRequest);
        httpServer.listen(80, "0.0.0.0");
        console.log(`Web App server started on http://portal.turbobuilt.com:80`);

        await ensureMainSsl();
        var server = await startServer({ port: 443, https: true });
        console.log(`Web App server started on http://portal.turbobuilt.com:443`);
    }
    // await tlsRenewal();
    startTlsRenewalCron();
}
main();
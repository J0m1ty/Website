import { fileURLToPath } from "url";
import { WebServer } from "./WebServer.js";

// client/dist next to this package, wherever the repo is checked out
const root = fileURLToPath(new URL("../../client/dist", import.meta.url));

(async () => {
    const server = new WebServer({ root, port: Number(process.env.PORT) || 3000 });
    await server.start();
})();

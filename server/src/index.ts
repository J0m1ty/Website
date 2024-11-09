import { WebServer } from "./WebServer";

(async () => {
    const server = new WebServer({ root: "/home/web/site/client/dist", port: 3000 });
    await server.start();
})();
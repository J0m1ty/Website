import { existsSync, readFileSync, stat } from "fs";
import { join } from "path";
import { App, HttpResponse } from "uWebSockets.js";
import { uptime } from "os";
import { processes } from "./processes.js";

export const serveFile = (res: HttpResponse, filePath: string, contentType: string, encoding?: boolean) => {
    res.cork(() => {
        try {
            if (encoding) res.writeHeader("Content-Encoding", "br");
            res.writeHeader("Content-Type", contentType);

            const expiresDate = new Date();
            expiresDate.setMonth(expiresDate.getMonth() + 1);

            res.writeHeader("Expires", expiresDate.toUTCString());
            res.writeHeader("Cache-Control", "public, max-age=2592000");

            const file = readFileSync(filePath);
            res.end(file);
        }
        catch (error) {
            res.writeStatus("500 Internal Server Error").end();
        }
    });
}

export const getContentType = (url: string) => {
    const ext = url.split(".").pop();
    switch (ext) {
        case "html":
            return "text/html";
        case "js":
            return "application/javascript";
        case "css":
            return "text/css";
        case "png":
            return "image/png";
        case "jpg":
            return "image/jpeg";
        default:
            return "text/plain";
    }
}

export const compare = (a: number, b: number) => {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
}

export class WebServer {
    root: string;
    port: number;

    constructor({ root, port }: { root: string; port: number }) {
        this.root = root;
        this.port = port;
    }

    async start() {
        await new Promise((resolve, reject) => {
            const server = App();

            server.get("/api/status", (res) => {
                let abort = false;
                res.onAborted(() => abort = true);

                // set CORS
                res.writeHeader("Access-Control-Allow-Origin", "*");
                res.writeHeader("Access-Control-Allow-Methods", "GET");
                
                processes([
                    { name: "minecraft", search: "minecraft_process" },
                    { name: "armadahex", search: "auth_process" },
                    { name: "threadblend", search: "threadblend_process" },
                    { name: "website", search: "website_process" },
                    { name: "nginx", search: "nginx" },
                ]).then((list) => {
                    const out = {
                        uptime: uptime() * 1000,
                        processes: Object.entries(list).map(([key, value]) => (value === undefined ? {
                            name: key,
                            status: "offline"
                        } : {
                            name: key,
                            status: "online",
                            cpu: Math.floor(value.cpu * 100) / 100,
                            memory: Math.floor(value.memory * 100) / 100,
                            uptime: value.uptime
                        }))
                    };

                    if (abort) return;
                    res.cork(() => {
                        res.writeHeader("Content-Type", "application/json");
                        res.end(JSON.stringify(out));
                    });
                });
            }).get("/*", (res, req) => {
                let abort = false;
                res.onAborted(() => abort = true);

                let url = req.getUrl();
                let filePath = join(this.root, url);
                const encodingHeader = req.getHeader("accept-encoding");

                let encoding = encodingHeader.includes("br") && existsSync(filePath + ".br");

                stat(filePath, (err, stats) => {
                    if (abort) return;

                    if (err || !stats.isFile()) {
                        serveFile(res, join(this.root, "index.html"), "text/html");
                    } else {
                        serveFile(res, filePath, getContentType(url), encoding);
                    }
                });
            }).listen(this.port, (token) => token ? (console.log(`Web server listening on :${this.port}`), resolve(server)) : reject(new Error()));
        });
    }
}
import { existsSync, readFileSync, stat } from "fs";
import { join } from "path";
import { App, HttpResponse } from "uWebSockets.js";

export const serveFile = (res: HttpResponse, filePath: string, contentType: string, encoding?: boolean) => {
    res.cork(() => {
        try {
            if (encoding) res.writeHeader("Content-Encoding", "br");
            res.writeHeader("Content-Type", contentType);

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
        default:
            return "text/plain";
    }
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

            server.any("/*", (res, req) => {
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
                        return;
                    } else {
                        serveFile(res, filePath, getContentType(url), encoding);
                    }
                });
            }).listen(this.port, (token) => token ? (console.log(`Web server listening on :${this.port}`), resolve(server)) : reject(new Error()));
        });
    }
}
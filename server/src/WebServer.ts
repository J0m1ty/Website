import { existsSync, readFileSync, stat } from "fs";
import { join } from "path";
import { App, HttpResponse } from "uWebSockets.js";
import { processes } from "systeminformation";
import { uptime } from "os";

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

                processes().then((data) => {
                    const search = [
                        { name: "threadblend", term: "threadblend_process" },
                        { name: "website", term: "website_process" },
                        { name: "nginx", term: "nginx" },
                    ] as const;

                    const results: { [ key: string ]: { name: string, data: typeof data.list[0] | null } } = {};
                    search.forEach(({ name, term }) => {
                        let list = data.list.filter((p) => p.command.toLowerCase().includes(term) || p.params.toLowerCase().includes(term));

                        if (list.length === 0) {
                            results[term] = { name, data: null };
                            return;
                        }

                        // filter out sleeping
                        let filtered = list.filter((p) => p.state !== "sleeping");
                        if (filtered.length > 0) list = filtered;
                        
                        // sort by cpu usage
                        list.sort((a, b) => compare(b.cpu, a.cpu) * 10 + compare(b.memRss, a.memRss));
                        results[term] = { name, data: list[0] };
                    });

                    const out = {
                        uptime: uptime() * 1000,
                        processes: Object.entries(results).map(([_, { name, data }]) => (data === null ? {
                            name: name.endsWith("_process") ? name.slice(0, -8) : name,
                            status: "offline"
                        } : {
                            name: name.endsWith("_process") ? name.slice(0, -8) : name,
                            status: "online",
                            cpu: Math.floor(data.cpu * 100000) / 100000,
                            memory: data.memRss,
                            started: new Date(data.started.replace(" ", "T")).getTime(),
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
                        return;
                    } else {
                        serveFile(res, filePath, getContentType(url), encoding);
                    }
                });
            }).listen(this.port, (token) => token ? (console.log(`Web server listening on :${this.port}`), resolve(server)) : reject(new Error()));
        });
    }
}
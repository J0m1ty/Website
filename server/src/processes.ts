import { spawn } from "child_process";

const getBounds = (text: string, search: string, end: boolean = false): { a: number, b: number } => {
    const a = text.indexOf(search);
    if (a === -1) return { a: -1, b: -1 };
    return { a, b: end ? Infinity : a + search.length };
}

export type Process = {
    cpu: number;
    memory: number;
    uptime: number;
}

export type ProcessList = {
    [ name: string ]: Process | undefined;
}

export const processes = async (input: { name: string, search: string }[]): Promise<ProcessList> => {
    return new Promise<ProcessList>((resolve, reject) => {
        const results: ProcessList = Object.values(input).reduce((acc, { name }) => {
            acc[name] = undefined;
            return acc;
        }, {} as ProcessList);

        const ps = spawn("ps", ["-eo", "%cpu,%mem,etime,args"]);

        const bounds = {
            cpu: { a: -1, b: -1 },
            memory: { a: -1, b: -1 },
            uptime: { a: -1, b: -1 },
            args: { a: -1, b: -1 }
        }

        ps.stdout.on("data", (chunk) => {
            const data = chunk.toString() as string;
            const lines = data.split("\n");

            const header = lines[0];
            if (!header) return;

            if (header.startsWith("%CPU")) {
                bounds.cpu = getBounds(header, "%CPU");
                bounds.memory = getBounds(header, "%MEM");
                bounds.uptime = getBounds(header, "ELAPSED");
                bounds.args = getBounds(header, "COMMAND", true);
            }

            if (bounds.cpu.a === -1 || bounds.memory.a === -1 || bounds.uptime.a === -1 || bounds.args.a === -1) return;

            lines.forEach((line) => {
                const cpu = parseFloat(line.substring(bounds.cpu.a, bounds.cpu.b).trim());
                const memory = parseFloat(line.substring(bounds.memory.a, bounds.memory.b).trim());
                const uptime = line.substring(bounds.uptime.a, bounds.uptime.b).trim();
                const args = line.substring(bounds.args.a, bounds.args.b).trim();

                const match = input.find((i) => args.toLowerCase().includes(i.search));
                if (!match) return;

                let split = uptime.split("-");
                if (split.length === 1) split = ["0", ...split];
                
                const [ days, rest ] = split;

                split = rest.split(":");
                if (split.length === 1) split = ["0", "0", ...split];
                if (split.length === 2) split = ["0", ...split];

                const [ hours, minutes, seconds ] = split;
                
                let ms = 0;
                ms += parseInt(days) * 24 * 60 * 60 * 1000;
                ms += parseInt(hours) * 60 * 60 * 1000;
                ms += parseInt(minutes) * 60 * 1000;
                ms += parseInt(seconds) * 1000;

                results[match.name] = { 
                    cpu: (results[match.name]?.cpu ?? 0) + cpu,
                    memory: (results[match.name]?.memory ?? 0) + memory,
                    uptime: ms
                }
            });
        });

        ps.stdout.on("close", () => {
            resolve(results);
        });

        ps.on("error", (err) => {
            reject(err);
        });
    });
}
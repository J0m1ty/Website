// Each (character, color, style) is drawn once into a big offscreen canvas;
// frames then just copy cell-sized rectangles out of it, which is far cheaper
// than fillText for every cell.
//
// Box-drawing and block characters are drawn as shapes instead of font
// glyphs, so borders join seamlessly across cells whatever the font or line
// height.

import { BOLD, IN_DOWN, IN_LEFT, IN_RIGHT, IN_UP, INSIDE } from './buffer';
import { FONT_FAMILY, type Metrics } from './metrics';

const ATLAS_SIZE = 2048;

// Which arms a line character has: [up, right, down, left]
const LINES: Record<string, number[]> = {
    '─': [0, 1, 0, 1], '│': [1, 0, 1, 0],
    '┌': [0, 1, 1, 0], '┐': [0, 0, 1, 1], '└': [1, 1, 0, 0], '┘': [1, 0, 0, 1],
    '├': [1, 1, 1, 0], '┤': [1, 0, 1, 1], '┬': [0, 1, 1, 1], '┴': [1, 1, 0, 1], '┼': [1, 1, 1, 1],
};
// Rounded corners: [horizontal arm (1 right, -1 left), vertical arm (1 down, -1 up)]
const ARCS: Record<string, number[]> = { '╭': [1, 1], '╮': [-1, 1], '╰': [1, -1], '╯': [-1, -1] };
const SHADES: Record<string, number> = { '░': 0.25, '▒': 0.5, '▓': 0.75, '█': 1 };

export class GlyphAtlas {
    readonly canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private m: Metrics;
    // aux color -> (glyph, fg, flags) -> slot. Two levels because all four
    // together don't fit in one exact JS number.
    private slots = new Map<number, Map<number, number>>();
    private next = 0;
    private perRow: number;
    private capacity: number;

    constructor(m: Metrics) {
        this.m = m;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvas.height = ATLAS_SIZE;
        this.ctx = this.canvas.getContext('2d')!;
        this.perRow = Math.floor(ATLAS_SIZE / m.cwDev);
        this.capacity = this.perRow * Math.floor(ATLAS_SIZE / m.chDev);
    }

    /** The atlas slot holding this glyph, drawing it the first time it's asked for. */
    slot(cp: number, fg: number, flags: number, aux: number): number {
        const key = cp * 4294967296 + fg * 256 + flags;
        let s = this.slots.get(aux)?.get(key);
        if (s === undefined) {
            if (this.next >= this.capacity) {
                this.slots.clear();
                this.next = 0;
                this.ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
            }
            s = this.next++;
            this.draw(s, cp, fg, flags, aux);
            let byAux = this.slots.get(aux);
            if (!byAux) this.slots.set(aux, (byAux = new Map()));
            byAux.set(key, s);
        }
        return s;
    }

    sx(s: number) { return (s % this.perRow) * this.m.cwDev; }
    sy(s: number) { return Math.floor(s / this.perRow) * this.m.chDev; }

    private draw(s: number, cp: number, fg: number, flags: number, aux: number) {
        const { cwDev: w, chDev: h, dpr, fontSize } = this.m;
        const ctx = this.ctx;
        const x0 = this.sx(s), y0 = this.sy(s);
        const ch = String.fromCodePoint(cp);
        const color = '#' + fg.toString(16).padStart(6, '0');

        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, y0, w, h);
        ctx.clip();
        ctx.fillStyle = ctx.strokeStyle = color;

        // Lines sit on the same pixel column/row in every cell so they connect.
        const lw = Math.max(1, Math.round(dpr));
        const cx = x0 + Math.floor((w - lw) / 2);
        const cy = y0 + Math.floor((h - lw) / 2);

        const arms = LINES[ch], arc = ARCS[ch], shade = SHADES[ch];

        // Fill the inside part of a border cell first; the line goes on top.
        if (flags & INSIDE) {
            ctx.fillStyle = '#' + aux.toString(16).padStart(6, '0');
            if (arc) {
                const [hd, vd] = arc;
                const ex = hd > 0 ? x0 + w : x0, ey = vd > 0 ? y0 + h : y0;
                ctx.beginPath();
                ctx.ellipse(ex, ey, Math.abs(ex - (cx + lw / 2)), Math.abs(ey - (cy + lw / 2)), 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                if (flags & IN_DOWN) ctx.fillRect(x0, cy, w, y0 + h - cy);
                if (flags & IN_UP) ctx.fillRect(x0, y0, w, cy + lw - y0);
                if (flags & IN_RIGHT) ctx.fillRect(cx, y0, x0 + w - cx, h);
                if (flags & IN_LEFT) ctx.fillRect(x0, y0, cx + lw - x0, h);
            }
            ctx.fillStyle = color;
        }

        if (arms) {
            const [up, right, down, left] = arms;
            if (up) ctx.fillRect(cx, y0, lw, cy - y0 + lw);
            if (down) ctx.fillRect(cx, cy, lw, y0 + h - cy);
            if (left) ctx.fillRect(x0, cy, cx - x0 + lw, lw);
            if (right) ctx.fillRect(cx, cy, x0 + w - cx, lw);
        } else if (arc) {
            // A quarter of an ellipse centred on the cell corner the arms point at,
            // passing through the same points the straight lines end on.
            const [hd, vd] = arc;
            const px = cx + lw / 2, py = cy + lw / 2;
            const ex = hd > 0 ? x0 + w : x0;
            const ey = vd > 0 ? y0 + h : y0;
            ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.ellipse(ex, ey, Math.abs(ex - px), Math.abs(ey - py), 0, 0, Math.PI * 2);
            ctx.stroke();
        } else if (shade) {
            ctx.globalAlpha = shade;
            ctx.fillRect(x0, y0, w, h);
        } else if (ch === '▀') {
            ctx.fillRect(x0, y0, w, Math.ceil(h / 2));
        } else if (ch === '▄') {
            ctx.fillRect(x0, y0 + Math.floor(h / 2), w, h - Math.floor(h / 2));
        } else {
            ctx.font = `${flags & BOLD ? '700 ' : ''}${fontSize * dpr}px ${FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ch, x0 + w / 2, y0 + h / 2);
        }
        ctx.restore();
    }
}

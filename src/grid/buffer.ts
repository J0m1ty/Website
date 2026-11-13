// A screen's worth of character cells, stored as flat typed arrays so a full
// frame can be built and compared without allocating anything.

export const SPACE = 32;

// Cell flags
export const BOLD = 1;
// "Inside" sides of a border cell: the part of the cell on that side of the
// line is filled with the cell's `aux` color, the rest stays transparent.
export const IN_UP = 2;
export const IN_RIGHT = 4;
export const IN_DOWN = 8;
export const IN_LEFT = 16;
export const INSIDE = IN_UP | IN_RIGHT | IN_DOWN | IN_LEFT;

/** Colors are packed 0xRRGGBB numbers. */
export const rgb = (r: number, g: number, b: number) => ((r & 255) << 16) | ((g & 255) << 8) | (b & 255);

/** Linear blend from color a to color b (t = 0 gives a, t = 1 gives b). */
export function mix(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    return rgb(
        Math.round(ar + (br - ar) * t),
        Math.round(ag + (bg - ag) * t),
        Math.round(ab + (bb - ab) * t),
    );
}

/** Parses "#rrggbb", "#rgb" or "rgb(r, g, b)". */
export function parseColor(css: string, fallback: number): number {
    const s = css.trim();
    if (s.startsWith('#')) {
        const hex = s.length === 4 ? s.slice(1).split('').map((c) => c + c).join('') : s.slice(1, 7);
        const n = parseInt(hex, 16);
        return Number.isNaN(n) ? fallback : n;
    }
    const m = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    return m ? rgb(+m[1], +m[2], +m[3]) : fallback;
}

export class CellBuffer {
    readonly cols: number;
    readonly rows: number;
    readonly size: number;
    readonly glyph: Uint32Array;   // Unicode code point
    readonly fg: Uint32Array;
    readonly bg: Uint32Array;
    readonly aux: Uint32Array;     // fill color for the INSIDE part of a border cell
    readonly under: Uint32Array;   // a glyph drawn beneath this one (masked by its fill)
    readonly underFg: Uint32Array;
    readonly flags: Uint8Array;

    constructor(cols: number, rows: number) {
        this.cols = cols;
        this.rows = rows;
        this.size = cols * rows;
        this.glyph = new Uint32Array(this.size).fill(SPACE);
        this.fg = new Uint32Array(this.size);
        this.bg = new Uint32Array(this.size);
        this.aux = new Uint32Array(this.size);
        this.under = new Uint32Array(this.size).fill(SPACE);
        this.underFg = new Uint32Array(this.size);
        this.flags = new Uint8Array(this.size);
    }

    has(x: number, y: number) {
        return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
    }

    /** Sets a cell's character and colors, keeping its background. */
    set(x: number, y: number, ch: string | number, fg: number, flags = 0, aux = 0) {
        if (!this.has(x, y)) return;
        const i = y * this.cols + x;
        this.glyph[i] = typeof ch === 'number' ? ch : ch.codePointAt(0)!;
        this.fg[i] = fg;
        this.flags[i] = flags;
        this.aux[i] = aux;
        this.under[i] = SPACE;
    }

    /**
     * Like set, but whatever character was here stays underneath. With INSIDE
     * flags, the inside part is filled over it, so only the outside part shows.
     */
    edge(x: number, y: number, ch: string, fg: number, flags: number, aux: number) {
        if (!this.has(x, y)) return;
        const i = y * this.cols + x;
        const below = this.glyph[i], belowFg = this.fg[i];
        this.set(x, y, ch, fg, flags, aux);
        this.under[i] = below;
        this.underFg[i] = belowFg;
    }

    text(x: number, y: number, str: string, fg: number, flags = 0) {
        let i = 0;
        for (const ch of str) this.set(x + i++, y, ch, fg, flags);
    }

    /** Copies cell i from another buffer of the same size. */
    copyCell(other: CellBuffer, i: number) {
        this.glyph[i] = other.glyph[i];
        this.fg[i] = other.fg[i];
        this.bg[i] = other.bg[i];
        this.aux[i] = other.aux[i];
        this.under[i] = other.under[i];
        this.underFg[i] = other.underFg[i];
        this.flags[i] = other.flags[i];
    }

    copyFrom(other: CellBuffer) {
        this.glyph.set(other.glyph);
        this.fg.set(other.fg);
        this.bg.set(other.bg);
        this.aux.set(other.aux);
        this.under.set(other.under);
        this.underFg.set(other.underFg);
        this.flags.set(other.flags);
    }
}

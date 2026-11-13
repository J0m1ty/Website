// Things that draw into a cell rectangle the DOM has reserved.

import { BOLD, CellBuffer, IN_DOWN, IN_LEFT, IN_RIGHT, IN_UP, SPACE, mix } from './buffer';
import { P } from './palette';
import { hash } from './hash';
import type { CellRect, Frame } from './scene';

// ── Panels ────────────────────────────────────────────────────────────────

export type BorderStyle = 'round' | 'square';

/**
 * Puts border characters round a rectangle. Each border cell keeps whatever
 * was drawn there before as its "under" glyph; the border's fill covers the
 * inside half of it, so the background looks like it runs under the edge.
 */
function border(buf: CellBuffer, r: CellRect, style: BorderStyle, fill: number) {
    const { col, row, w, h } = r;
    const x1 = col + w - 1, y1 = row + h - 1;
    const [tl, tr, bl, br] = style === 'round' ? '╭╮╰╯' : '┌┐└┘';
    const BORDER = P.border;

    buf.edge(col, row, tl, BORDER, IN_DOWN | IN_RIGHT, fill);
    buf.edge(x1, row, tr, BORDER, IN_DOWN | IN_LEFT, fill);
    buf.edge(col, y1, bl, BORDER, IN_UP | IN_RIGHT, fill);
    buf.edge(x1, y1, br, BORDER, IN_UP | IN_LEFT, fill);
    for (let x = col + 1; x < x1; x++) {
        buf.edge(x, row, '─', BORDER, IN_DOWN, fill);
        buf.edge(x, y1, '─', BORDER, IN_UP, fill);
    }
    for (let y = row + 1; y < y1; y++) {
        buf.edge(col, y, '│', BORDER, IN_RIGHT, fill);
        buf.edge(x1, y, '│', BORDER, IN_LEFT, fill);
    }
}

/** The title sits in the top border; below the line, its cells get the card's fill. */
function title(buf: CellBuffer, r: CellRect, text: string | undefined, fill: number) {
    if (!text || text.length + 4 > r.w) return;
    let x = r.col + 2;
    for (const ch of ` ${text} `) buf.set(x++, r.row, ch, P.title, BOLD | IN_DOWN, fill);
}

/** A filled card: the inside of the border line is filled, the outside stays transparent. */
export function paintPanel(buf: CellBuffer, r: CellRect, style: BorderStyle, label?: string) {
    const { col, row, w, h } = r;
    if (w < 2 || h < 2) return;

    for (let y = row + 1; y < row + h - 1; y++) {
        for (let x = col + 1; x < col + w - 1; x++) {
            if (!buf.has(x, y)) continue;
            const i = y * buf.cols + x;
            buf.glyph[i] = SPACE;
            buf.bg[i] = P.fill;
        }
    }
    border(buf, r, style, P.fill);
    title(buf, r, label, P.fill);
}

/**
 * A card with no background: the resting field is cleared inside it, but
 * streams still fall through behind the text. The text is drawn here from
 * the element's HTML (which stays, invisible, for selection and links).
 */
export function paintRainPanel(buf: CellBuffer, r: CellRect, f: Frame, style: BorderStyle, label?: string) {
    const { col, row, w, h } = r;
    if (w < 2 || h < 2) return;

    // Lines of text keep the rain out (from their first character to their
    // last, plus one cell either side) so words stay readable.
    const lineFrom = new Map<number, number>(), lineTo = new Map<number, number>();
    for (const g of f.text) {
        lineFrom.set(g.dy, Math.min(lineFrom.get(g.dy) ?? Infinity, g.dx - 1));
        lineTo.set(g.dy, Math.max(lineTo.get(g.dy) ?? -Infinity, g.dx + 1));
    }

    // Inside: only the bright part of passing streams survives, faintly.
    for (let y = row + 1; y < row + h - 1; y++) {
        const from = lineFrom.get(y - row) ?? Infinity, to = lineTo.get(y - row) ?? -Infinity;
        for (let x = col + 1; x < col + w - 1; x++) {
            if (!buf.has(x, y)) continue;
            const i = y * buf.cols + x;
            const l = f.light[i];
            if (l < 0.35 || (x - col >= from && x - col <= to)) buf.glyph[i] = SPACE;
            else buf.fg[i] = mix(P.bg, buf.fg[i], (l - 0.35) * 0.6);
        }
    }

    border(buf, r, style, P.bg);
    title(buf, r, label, P.bg);

    for (const g of f.text) {
        const x = col + g.dx, y = row + g.dy;
        if (x <= col || y <= row || x >= col + w - 1 || y >= row + h - 1) continue;
        buf.set(x, y, g.cp, g.color, g.flags);
    }
}

/** Clears the rain under a rectangle, plus one cell either side, so DOM text on it reads. */
export function paintClear(buf: CellBuffer, r: CellRect) {
    for (let y = r.row; y < r.row + r.h; y++) {
        for (let x = r.col - 1; x <= r.col + r.w; x++) {
            if (buf.has(x, y)) buf.glyph[y * buf.cols + x] = SPACE;
        }
    }
}

// ── Banner: big letters made of half-block characters ─────────────────────
// Each font pixel is one cell wide and half a cell tall (cells are ~1:2), so
// pixels come out square. 8 pixel rows = 4 cell rows.

const FONT: Record<string, string[]> = {
    j: ['..#', '...', '..#', '..#', '..#', '..#', '..#', '##.'],
    o: ['....', '....', '.##.', '#..#', '#..#', '.##.', '....', '....'],
    m: ['.....', '.....', '####.', '#.#.#', '#.#.#', '#.#.#', '.....', '.....'],
    i: ['#', '.', '#', '#', '#', '#', '.', '.'],
    t: ['.#.', '.#.', '###', '.#.', '.#.', '..#', '...', '...'],
    y: ['....', '....', '#..#', '#..#', '#..#', '.###', '...#', '.##.'],
    '.': ['.', '.', '.', '.', '.', '#', '.', '.'],
    n: ['....', '....', '###.', '#..#', '#..#', '#..#', '....', '....'],
    e: ['....', '....', '.##.', '####', '#...', '.###', '....', '....'],
    ' ': ['..', '..', '..', '..', '..', '..', '..', '..'],
};
const FONT_ROWS = 8;
const ASPECT = 0.45;    // cell width / height, for round distances

export function bannerSize(text: string, scale: number) {
    let w = 0;
    for (const ch of text) w += (FONT[ch] ?? FONT[' '])[0].length + 1;
    return { w: Math.max(0, w - 1) * scale, h: (FONT_ROWS / 2) * scale };
}

/** Which block character each banner cell holds (0 for empty), row-major. */
function bannerCells(text: string, scale: number, w: number, h: number) {
    const cells = new Uint32Array(w * h);
    let px = 0;
    for (const ch of text) {
        const glyph = FONT[ch] ?? FONT[' '];
        const gw = glyph[0].length;
        for (let cy = 0; cy < h; cy++) {
            const top = glyph[Math.floor((cy * 2) / scale)];
            const bottom = glyph[Math.floor((cy * 2 + 1) / scale)];
            for (let cx = 0; cx < gw * scale; cx++) {
                const p = Math.floor(cx / scale);
                const a = top[p] === '#', b = bottom[p] === '#';
                if (a || b) cells[cy * w + px * scale + cx] = (a && b ? '█' : a ? '▀' : '▄').codePointAt(0)!;
            }
        }
        px += gw + 1;
    }
    return cells;
}

// Letter cells, plus distance to the nearest letter for a small area around
// them (the digits look clears an outline so the letters read).
const MARGIN_X = 3, MARGIN_Y = 2;
interface Layout { key: string; cells: Uint32Array; dist: Float32Array; areaW: number; areaH: number }
let cached: Layout | null = null;

function layout(text: string, scale: number, w: number, h: number): Layout {
    const key = `${text}|${scale}|${w}|${h}`;
    if (cached?.key === key) return cached;
    const cells = bannerCells(text, scale, w, h);
    const areaW = w + 2 * MARGIN_X, areaH = h + 2 * MARGIN_Y;
    const letters: number[] = [];
    for (let i = 0; i < cells.length; i++) if (cells[i]) letters.push(i % w + MARGIN_X, Math.floor(i / w) + MARGIN_Y);
    const dist = new Float32Array(areaW * areaH);
    for (let ay = 0; ay < areaH; ay++) {
        for (let ax = 0; ax < areaW; ax++) {
            let best = Infinity;
            for (let k = 0; k < letters.length; k += 2) {
                const dx = (ax - letters[k]) * ASPECT, dy = ay - letters[k + 1];
                best = Math.min(best, dx * dx + dy * dy);
            }
            dist[ay * areaW + ax] = Math.sqrt(best);
        }
    }
    return (cached = { key, cells, dist, areaW, areaH });
}

/** blocks: half-block pixels. digits: bold 0s and 1s (kept for a possible splash page). */
export type BannerLook = 'blocks' | 'digits';
/** shimmer: a band of light sweeps across. rain: steady, lit by streams passing behind. */
export type BannerGlow = 'shimmer' | 'rain';

export interface BannerOptions {
    time: number;
    scale: number;
    look: BannerLook;
    glow: BannerGlow;
    light: Float32Array;    // rain light per buffer cell
    /** A glitch burst in progress: its random seed and seconds since it began. */
    glitch: { seed: number; t: number } | null;
}

// ── Glitch ──
// For a fraction of a second, a few rows of the logo jump sideways (and
// brighten), and some letter pixels turn into stray digits. The pattern
// changes every 1/20s step of the burst.
const GLITCH_STEP = 20;
const GLITCH_ROWS = 0.35;   // chance each row is shifted, per step
const GLITCH_NOISE = 0.07;  // chance a letter pixel turns into a digit, per step

function glitchShift(g: { seed: number; t: number }, row: number) {
    const step = Math.floor(g.t * GLITCH_STEP);
    if (hash(g.seed, row, step) >= GLITCH_ROWS) return 0;
    const amount = Math.round((hash(row, g.seed, step + 7) - 0.5) * 8);
    return amount || 1;
}

const FULL = '█'.codePointAt(0)!;
const OUTLINE = 1.1;    // digits look: rain is cleared this close to the letters, in row heights

function letterCell(buf: CellBuffer, x: number, y: number, block: number, o: BannerOptions, flash: number) {
    let color: number;
    if (o.glow === 'rain') {
        const l = buf.has(x, y) ? o.light[y * buf.cols + x] : 0;
        color = mix(P.steady, P.rainLit, l * l * 0.9 + l * 0.1);
    } else {
        color = shimmer(x, y, o.time);
    }
    if (flash > 0) color = mix(color, P.flash, flash);
    if (o.look === 'blocks') {
        buf.set(x, y, block, color);
        return;
    }
    if (block !== FULL) color = mix(color, P.bg, 0.45);
    const phase = hash(x, y, 5) * 10;
    const digit = hash(x, y, Math.floor(o.time * 0.8 + phase)) < 0.5 ? '0' : '1';
    buf.set(x, y, digit, color, BOLD);
}

export function paintBanner(buf: CellBuffer, r: CellRect, text: string, o: BannerOptions) {
    const { cells, dist, areaW, areaH } = layout(text, o.scale, r.w, r.h);

    if (o.look === 'digits') {
        for (let ay = 0; ay < areaH; ay++) {
            for (let ax = 0; ax < areaW; ax++) {
                const d = dist[ay * areaW + ax];
                const x = r.col + ax - MARGIN_X, y = r.row + ay - MARGIN_Y;
                if (d > 0 && d <= OUTLINE && buf.has(x, y)) buf.glyph[y * buf.cols + x] = SPACE;
            }
        }
    }

    const g = o.glitch;
    const step = g ? Math.floor(g.t * GLITCH_STEP) : 0;
    for (let ly = 0; ly < r.h; ly++) {
        const shift = g ? glitchShift(g, ly) : 0;
        for (let lx = 0; lx < r.w; lx++) {
            const block = cells[ly * r.w + lx];
            if (!block) continue;
            const x = r.col + lx + shift, y = r.row + ly;
            if (g && hash(lx, ly, g.seed + step * 31) < GLITCH_NOISE) {
                buf.set(x, y, hash(ly, lx, step) < 0.5 ? '0' : '1', P.hot, BOLD);
            } else {
                letterCell(buf, x, y, block, o, shift ? 0.35 : 0);
            }
        }
    }
}

function shimmer(x: number, y: number, time: number) {
    const wave = 0.5 + 0.5 * Math.sin(x * 0.18 + y * 0.6 - time * 2.2);
    return P.shimmer[Math.round(wave * (P.shimmer.length - 1))];
}

// ── Prompt: a pulsing line of text, e.g. "< click to enter >" ──

export function paintPrompt(buf: CellBuffer, r: CellRect, label: string, time: number) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    const color = mix(P.promptLow, P.promptHigh, pulse);
    const len = [...label].length;
    const x0 = r.col + Math.floor((r.w - len) / 2);
    // Clear the rain right behind the words (one cell either side) so they read.
    for (let x = x0 - 1; x <= x0 + len; x++) {
        if (buf.has(x, r.row)) buf.glyph[r.row * buf.cols + x] = SPACE;
    }
    buf.text(x0, r.row, label, color, BOLD);
}

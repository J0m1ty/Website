// Draws a CellBuffer onto a canvas. Only cells that differ from the previous
// frame are redrawn. There are two layers:
//
//   back: fixed to the screen, behind everything. The rain (or the plain
//     page color). Its buffer is the screen's rows plus the partly visible
//     row at the top and bottom.
//   front: inside the scrolling page (see GridRoot), so the browser scrolls it
//     together with the text, on the same frame. Cards, banners, shadows.
//     Cells nothing drew in are transparent, so the back shows through.
//     Buffer row 0 is page row `row0`; setAnchor moves the canvas when that
//     changes.

import { GlyphAtlas } from './atlas';
import { CellBuffer, INSIDE, SPACE, TRANSPARENT } from './buffer';
import type { Metrics } from './metrics';
import { hex, P } from './palette';

export type Layer = 'back' | 'front';

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private layer: Layer;
    private atlas: GlyphAtlas | null = null;
    private prev: CellBuffer | null = null;
    private m: Metrics | null = null;
    private css = new Map<number, string>();
    private shadeCss: string[] = [];
    private shadeOf = -1;
    private row0 = NaN;

    constructor(canvas: HTMLCanvasElement, layer: Layer) {
        this.canvas = canvas;
        this.layer = layer;
        this.ctx = canvas.getContext('2d', { alpha: layer === 'front' })!;
    }

    resize(m: Metrics) {
        this.m = m;
        const h = this.layer === 'back' ? m.heightDev : m.bufRows * m.chDev;
        this.canvas.width = m.widthDev;
        this.canvas.height = h;
        this.canvas.style.width = `${m.widthDev / m.dpr}px`;
        this.canvas.style.height = `${h / m.dpr}px`;
        this.row0 = NaN;
        this.atlas = new GlyphAtlas(m);
        this.invalidate();
    }

    /** Repaints everything next draw, margins included (the palette changed, or the canvas moved). */
    invalidate() {
        this.prev = null;
        if (!this.m) return;
        if (this.layer === 'front') {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = hex(P.bg);
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /** Front only: puts buffer row 0 at page row `row0` (page rows count from the grid origin). */
    setAnchor(row0: number) {
        const m = this.m;
        if (!m || row0 === this.row0) return;
        this.row0 = row0;
        this.canvas.style.top = `${(m.oyDev + row0 * m.chDev) / m.dpr}px`;
        this.invalidate();
    }

    draw(buf: CellBuffer) {
        const { ctx, atlas, prev, m } = this;
        if (!atlas || !m) return;
        const { cwDev, chDev, oxDev } = m;
        const { cols, glyph, fg, bg, aux, flags, under, underFg, shade } = buf;
        // The back's row 0 is the partly visible row above the grid.
        const y0 = this.layer === 'back' ? m.oyDev - chDev : 0;

        for (let i = 0; i < buf.size; i++) {
            if (prev && prev.glyph[i] === glyph[i] && prev.fg[i] === fg[i] &&
                prev.bg[i] === bg[i] && prev.aux[i] === aux[i] && prev.flags[i] === flags[i] &&
                prev.under[i] === under[i] && prev.underFg[i] === underFg[i] && prev.shade[i] === shade[i]) continue;

            const x = oxDev + (i % cols) * cwDev;
            const y = y0 + Math.floor(i / cols) * chDev;
            if (bg[i] === TRANSPARENT) {
                ctx.clearRect(x, y, cwDev, chDev);
                if (shade[i]) {
                    ctx.fillStyle = this.shadeColor(shade[i]);
                    ctx.fillRect(x, y, cwDev, chDev);
                }
            } else {
                ctx.fillStyle = this.color(bg[i]);
                ctx.fillRect(x, y, cwDev, chDev);
            }
            if (under[i] !== SPACE) {
                const s = atlas.slot(under[i], underFg[i], 0, 0);
                ctx.drawImage(atlas.canvas, atlas.sx(s), atlas.sy(s), cwDev, chDev, x, y, cwDev, chDev);
            }
            if (glyph[i] !== SPACE || flags[i] & INSIDE) {
                const s = atlas.slot(glyph[i], fg[i], flags[i], aux[i]);
                ctx.drawImage(atlas.canvas, atlas.sx(s), atlas.sy(s), cwDev, chDev, x, y, cwDev, chDev);
            }
        }

        if (!this.prev || this.prev.size !== buf.size) this.prev = new CellBuffer(buf.cols, buf.rows);
        this.prev.copyFrom(buf);
    }

    private color(c: number) {
        let s = this.css.get(c);
        if (!s) this.css.set(c, (s = '#' + c.toString(16).padStart(6, '0')));
        return s;
    }

    /** The page color at alpha a/255. */
    private shadeColor(a: number) {
        if (this.shadeOf !== P.bg) {
            this.shadeOf = P.bg;
            this.shadeCss = [];
        }
        let s = this.shadeCss[a];
        if (!s) {
            const c = P.bg;
            s = this.shadeCss[a] = `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${(a / 255).toFixed(3)})`;
        }
        return s;
    }
}

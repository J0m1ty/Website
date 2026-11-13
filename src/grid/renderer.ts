// Draws a CellBuffer onto the screen canvas. Only cells that differ from the
// previous frame are redrawn.

import { GlyphAtlas } from './atlas';
import { CellBuffer, INSIDE, SPACE } from './buffer';
import type { Metrics } from './metrics';
import { hex, P } from './palette';

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private atlas: GlyphAtlas | null = null;
    private prev: CellBuffer | null = null;
    private m: Metrics | null = null;
    private css = new Map<number, string>();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false })!;
    }

    resize(m: Metrics) {
        this.m = m;
        this.canvas.width = m.widthDev;
        this.canvas.height = m.heightDev;
        this.canvas.style.width = `${m.widthDev / m.dpr}px`;
        this.canvas.style.height = `${m.heightDev / m.dpr}px`;
        this.atlas = new GlyphAtlas(m);
        this.invalidate();
    }

    /** Repaints everything next draw, margins included (the palette changed). */
    invalidate() {
        this.prev = null;
        if (!this.m) return;
        this.ctx.fillStyle = hex(P.bg);
        this.ctx.fillRect(0, 0, this.m.widthDev, this.m.heightDev);
    }

    draw(buf: CellBuffer) {
        const { ctx, atlas, prev, m } = this;
        if (!atlas || !m) return;
        const { cwDev, chDev, bufOxDev: oxDev, bufOyDev: oyDev } = m;
        const { cols, glyph, fg, bg, aux, flags, under, underFg } = buf;

        for (let i = 0; i < buf.size; i++) {
            if (prev && prev.glyph[i] === glyph[i] && prev.fg[i] === fg[i] &&
                prev.bg[i] === bg[i] && prev.aux[i] === aux[i] && prev.flags[i] === flags[i] &&
                prev.under[i] === under[i] && prev.underFg[i] === underFg[i]) continue;

            const x = oxDev + (i % cols) * cwDev;
            const y = oyDev + Math.floor(i / cols) * chDev;
            ctx.fillStyle = this.color(bg[i]);
            ctx.fillRect(x, y, cwDev, chDev);
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
}

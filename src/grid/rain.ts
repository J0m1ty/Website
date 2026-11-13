// The background layer: a field of dim 1s and 0s with brighter streams
// falling through it, one stream per column.

import { CellBuffer } from './buffer';
import { P } from './palette';

const CHARS = ['0'.codePointAt(0)!, '1'.codePointAt(0)!];

interface Drop { y: number; speed: number; length: number }

const random = (a: number, b: number) => a + Math.random() * (b - a);
const randomChar = () => CHARS[(Math.random() * CHARS.length) | 0];

export class Rain {
    private cols = 0;
    private rows = 0;
    private glyphs = new Uint32Array(0);
    private drops: Drop[] = [];
    /** How lit each cell is by a passing stream, 0 (resting field) to 1 (stream head). */
    light = new Float32Array(0);

    /** Keeps whatever overlaps the old size, so resizing doesn't reshuffle the field. */
    resize(cols: number, rows: number) {
        const glyphs = new Uint32Array(cols * rows);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                glyphs[y * cols + x] = x < this.cols && y < this.rows
                    ? this.glyphs[y * this.cols + x]
                    : randomChar();
            }
        }
        this.glyphs = glyphs;
        this.light = new Float32Array(cols * rows);
        this.cols = cols;
        this.rows = rows;
        this.drops.length = cols;
        for (let x = 0; x < cols; x++) this.drops[x] ??= this.spawn(true);
    }

    update(dt: number) {
        for (let x = 0; x < this.cols; x++) {
            const d = this.drops[x];
            d.y += d.speed * dt;
            if (d.y - d.length > this.rows) this.drops[x] = this.spawn(false);
        }
        // A few cells flip every frame so the field shimmers.
        const flips = this.glyphs.length * dt * 0.4;
        for (let n = 0; n < flips; n++) {
            this.glyphs[(Math.random() * this.glyphs.length) | 0] = randomChar();
        }
    }

    /** With `blank` (rain turned off) there's no rain at all, just the page background. */
    paint(buf: CellBuffer, blank = false) {
        const { cols, rows } = this;
        const { rain, rainHead, bg } = P;   // rain: quantized levels, resting field to lit stream
        for (let x = 0; x < cols; x++) {
            const d = this.drops[x];
            const head = Math.floor(d.y);
            for (let y = 0; y < rows; y++) {
                const i = y * cols + x;
                const dist = head - y;
                const level = dist === 0 ? 1 : dist > 0 && dist < d.length ? 1 - dist / d.length : 0;
                this.light[i] = blank ? 0 : level;
                buf.glyph[i] = blank ? 32 : this.glyphs[i];
                buf.fg[i] = dist === 0 ? rainHead : rain[Math.round(level * (rain.length - 1))];
                buf.bg[i] = bg;
                buf.aux[i] = 0;
                buf.under[i] = 32;
                buf.flags[i] = 0;
            }
        }
    }

    private spawn(anywhere: boolean): Drop {
        return {
            y: anywhere ? random(-this.rows, this.rows) : random(-this.rows * 0.75, 0),
            speed: random(6, 22),
            length: random(6, this.rows * 0.6 + 6),
        };
    }
}

// Ties it together. Every frame:
//   1. read where CSS put each registered element, round it to whole cells,
//      and nudge the element (CSS `translate`) so its text sits exactly on the grid
//   2. paint layers back to front into one CellBuffer: rain, then each
//      region (parents before children)
//   3. hand the buffer to the renderer, which redraws only changed cells

import { BOLD, CellBuffer, parseColor } from './buffer';
import { rainOn, reducedMotion } from './settings';
import { P, paletteVersion } from './palette';
import type { Metrics } from './metrics';
import { Rain } from './rain';
import { Renderer } from './renderer';
import { now as clock } from './hash';
import { applyReveal, BOOT_DELAY, BOOT_STAGGER, paintFront, revealClip, revealDone, revealLength, type Reveal } from './reveal';

export interface CellRect { col: number; row: number; w: number; h: number }

/** One character of an element's HTML text, at a cell offset inside the element. */
export interface TextGlyph { dx: number; dy: number; cp: number; color: number; flags: number }

export interface Frame {
    time: number;
    /** Reduced motion: time is frozen, so effects should show their resting state. */
    still: boolean;
    /** Rain light per buffer cell, 0..1. */
    light: Float32Array;
    /** The element's own text, if it was registered with `mirror`. */
    text: TextGlyph[];
}

export type Painter = (buf: CellBuffer, rect: CellRect, frame: Frame) => void;

interface Region {
    el: HTMLElement;
    paint: Painter;
    depth: number;
    tx: number;     // the nudge currently applied, CSS px
    ty: number;
    rect: CellRect | null;
    mirror: MutationObserver | null;
    text: TextGlyph[];
    textDirty: boolean;
    reveal: Reveal | null;
}


export class Scene {
    metrics: Metrics | null = null;
    private buf = new CellBuffer(0, 0);
    private renderer: Renderer;
    private rain = new Rain();
    private regions: Region[] = [];
    private raf = 0;
    private last = 0;
    private time = 0;
    private snap = new CellBuffer(0, 0);   // cells under a revealing region, before it paints
    /** A ring transition in progress: components added meanwhile decode in with it. */
    private ring: { reveal: Reveal; end: number } | null = null;
    private palette = paletteVersion();
    /** The element the page scrolls in; its scroll position offsets the canvas. */
    scroller: HTMLElement | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new Renderer(canvas);
    }

    setMetrics(m: Metrics) {
        this.metrics = m;
        this.buf = new CellBuffer(m.bufCols, m.bufRows);
        this.snap = new CellBuffer(m.bufCols, m.bufRows);
        this.rain.resize(m.bufCols, m.bufRows);
        this.renderer.resize(m);
        for (const r of this.regions) r.textDirty = true;
    }

    /**
     * Draws `paint` into whatever cells `el` covers. With `mirror`, the
     * painter also gets the element's text, cell by cell, so it can draw the
     * text itself (the HTML copy stays for selection, links and screen readers).
     * Returns an unregister function.
     */
    add(el: HTMLElement, paint: Painter, { mirror = false } = {}) {
        let depth = 0;
        for (let n: HTMLElement | null = el; n; n = n.parentElement) depth++;
        const region: Region = {
            el, paint, depth, tx: 0, ty: 0, rect: null,
            mirror: null, text: [], textDirty: mirror, reveal: null,
        };
        if (mirror) {
            region.mirror = new MutationObserver(() => { region.textDirty = true; });
            region.mirror.observe(el, { subtree: true, childList: true, characterData: true });
        }
        if (this.ring && clock() < this.ring.end) {
            region.reveal = { ...this.ring.reveal };
            el.style.clipPath = 'circle(0px at 0 0)';
        }
        this.regions.push(region);
        this.regions.sort((a, b) => a.depth - b.depth);
        return () => {
            region.mirror?.disconnect();
            this.regions = this.regions.filter((r) => r !== region);
            el.style.translate = '';
        };
    }

    start() {
        const loop = (now: number) => {
            this.frame(now);
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);
    }

    stop() {
        cancelAnimationFrame(this.raf);
    }

    /**
     * Boots the page: every registered component decodes in from the
     * background, one after another in document order. Skipped for reduced motion.
     */
    boot() {
        if (reducedMotion()) return;
        const ordered = [...this.regions].sort((a, b) =>
            a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
        const t = clock();
        ordered.forEach((r, i) => {
            r.reveal = { start: t + BOOT_DELAY + i * BOOT_STAGGER, seed: i * 17 + 1, shape: { kind: 'fall' } };
            r.el.style.clipPath = 'inset(0 0 100% 0)';
        });
    }

    /**
     * A ring spreading from the centre of the screen: everything on screen now
     * decodes out as it passes, and anything added from now until it's done
     * decodes in behind it. Returns how long it takes, in seconds (0 for
     * reduced motion, where the swap is instant).
     */
    startRing() {
        const m = this.metrics;
        if (!m || reducedMotion()) return 0;
        const reveal: Reveal = {
            start: clock(), seed: 7,
            shape: { kind: 'ring', x: m.bufCols / 2, y: m.padY + m.rows / 2, aspect: m.cwDev / m.chDev },
        };
        const length = revealLength(reveal, { col: 0, row: 0, w: m.bufCols, h: m.bufRows });
        this.ring = { reveal, end: reveal.start + length };
        for (const r of this.regions) r.reveal = { ...reveal, hide: true };
        return length;
    }

    frame(now = performance.now()) {
        const m = this.metrics;
        if (!m) return;
        const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
        this.last = now;
        const still = reducedMotion();
        const rain = rainOn();
        if (!still) this.time += dt;
        if (rain) this.rain.update(dt);

        if (this.palette !== paletteVersion()) {
            this.palette = paletteVersion();
            this.renderer.invalidate();
            // Mirrored text holds colors read from CSS.
            for (const r of this.regions) r.textDirty = true;
        }

        // Scrolling moves the HTML by pixels, on the compositor. Rather than
        // snapping it back to whole rows every frame (it shook back and forth
        // under a finger), lay the grid out as if scrolled to the last whole
        // row and shift the canvas up by the rest, so both move smoothly.
        const scrollDev = Math.round((this.scroller?.scrollTop ?? 0) * m.dpr);
        const fracDev = ((scrollDev % m.chDev) + m.chDev) % m.chDev;
        this.layout(m, fracDev / m.dpr);
        this.renderer.setScroll(fracDev);
        this.rain.paint(this.buf, !rain);
        const t = clock();
        for (const r of this.regions) {
            if (!r.rect) continue;
            const frame = { time: this.time, still, light: this.rain.light, text: r.text };
            if (!r.reveal) {
                r.paint(this.buf, r.rect, frame);
                continue;
            }
            const done = revealDone(r.reveal, r.rect, t);
            if (r.reveal.hide) {
                // Decoding out: once the front has passed, there's nothing left to draw.
                if (done) continue;
                this.snapshot(r.rect);
                r.paint(this.buf, r.rect, frame);
                applyReveal(this.buf, this.snap, r.rect, r.reveal, t);
                continue;
            }
            this.snapshot(r.rect);
            r.paint(this.buf, r.rect, frame);
            applyReveal(this.buf, this.snap, r.rect, r.reveal, t);
            // The HTML inside (text, links) only shows where the front has finished with it.
            if (done) {
                r.reveal = null;
                r.el.style.clipPath = '';
            } else {
                r.el.style.clipPath = revealClip(r.reveal, r.rect, m, t);
            }
        }

        // The ring's band sweeps over everything, not just the components.
        if (this.ring) {
            if (t < this.ring.end) paintFront(this.buf, this.ring.reveal, t);
            else this.ring = null;
        }

        this.renderer.draw(this.buf);
    }

    private snapshot(r: CellRect) {
        for (let y = Math.max(0, r.row); y < Math.min(this.buf.rows, r.row + r.h); y++) {
            for (let x = Math.max(0, r.col); x < Math.min(this.buf.cols, r.col + r.w); x++) {
                this.snap.copyCell(this.buf, y * this.buf.cols + x);
            }
        }
    }

    /** `frac`: CSS px scrolled past the last whole row; the canvas is shifted up by it. */
    private layout(m: Metrics, frac: number) {
        const { dpr, cwDev, chDev, bufOxDev: oxDev, bufOyDev: oyDev } = m;
        for (const r of this.regions) {
            const b = r.el.getBoundingClientRect();
            if (b.width === 0 && b.height === 0) {
                r.rect = null;
                continue;
            }
            // Where CSS layout put the element, before our nudge, if the
            // scroll were at the last whole row. It only changes by whole
            // rows while scrolling, so the nudge stays put.
            const left = b.left - r.tx;
            const top = b.top - r.ty + frac;
            const col = Math.round((left * dpr - oxDev) / cwDev);
            const row = Math.round((top * dpr - oyDev) / chDev);
            const tx = (oxDev + col * cwDev) / dpr - left;
            const ty = (oyDev + row * chDev) / dpr - top;
            if (Math.abs(tx - r.tx) > 0.01 || Math.abs(ty - r.ty) > 0.01) {
                r.tx = tx;
                r.ty = ty;
                r.el.style.translate = `${tx}px ${ty}px`;
            }
            const w = Math.round((b.width * dpr) / cwDev);
            const h = Math.round((b.height * dpr) / chDev);
            // Text only moves relative to its element when the element's size changes.
            if (r.mirror && (r.textDirty || !r.rect || r.rect.w !== w || r.rect.h !== h)) {
                r.text = readText(r.el, m);
                r.textDirty = false;
            }
            r.rect = { col, row, w, h };
        }
    }
}

/** Where each visible character of an element's text sits, in cells from its top-left. */
function readText(el: HTMLElement, m: Metrics): TextGlyph[] {
    const out: TextGlyph[] = [];
    const box = el.getBoundingClientRect();
    const cw = m.cw, ch = m.ch;
    const range = document.createRange();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
        const parent = node.parentElement;
        if (!parent) continue;
        const style = getComputedStyle(parent);
        // Mirrored text is transparent in the DOM; its intended color lives in --ink.
        const color = parseColor(style.getPropertyValue('--ink'), P.ink);
        const flags = parseInt(style.fontWeight) >= 600 ? BOLD : 0;
        const data = node.data;
        for (let i = 0; i < data.length; i++) {
            const code = data.charCodeAt(i);
            if (code === 32 || code === 10 || code === 9 || code === 160) continue;
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const r = range.getBoundingClientRect();
            if (!r.width) continue;
            out.push({
                dx: Math.floor(((r.left + r.right) / 2 - box.left) / cw),
                dy: Math.floor(((r.top + r.bottom) / 2 - box.top) / ch),
                cp: data.codePointAt(i)!,
                color,
                flags,
            });
        }
    }
    return out;
}

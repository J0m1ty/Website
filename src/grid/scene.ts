// Ties it together. Every frame:
//   1. read where CSS put each registered element on the page, round it to
//      whole cells, and nudge the element (CSS `translate`) so its text sits
//      exactly on the grid
//
//   2. paint the rain into the back buffer (fixed to the screen)
//   3. paint shadows, then each region (parents before children), into the
//      front buffer, which is transparent wherever nothing is drawn
//   4. hand each buffer to its renderer, which redraws only changed cells
//
// The front canvas is part of the page and scrolls with it natively, so text
// and canvas can never drift apart mid-scroll. It covers the screen plus a
// margin, and when scrolling nears either end it's moved (setAnchor) and
// repainted. The back canvas doesn't scroll at all.

import { BOLD, CellBuffer, parseColor } from './buffer';
import { rainOn, reducedMotion } from './settings';
import { P, paletteVersion } from './palette';
import type { Metrics } from './metrics';
import { Rain } from './rain';
import { Renderer } from './renderer';
import { now as clock } from './hash';
import { applyReveal, BOOT_DELAY, BOOT_STAGGER, paintFront, revealClip, revealDone, revealLength, revealPassed, type Reveal } from './reveal';

export interface CellRect { col: number; row: number; w: number; h: number }

/** One character of an element's HTML text, at a cell offset inside the element. */
export interface TextGlyph { dx: number; dy: number; cp: number; color: number; flags: number }

export interface Frame {
    time: number;
    /** Reduced motion: time is frozen, so effects should show their resting state. */
    still: boolean;
    /** Rain light per (front) buffer cell, 0..1. */
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
    /** Darkens the rain around it, so it stands off the background. */
    shadow: boolean;
}

// Shadows: how far the rain is darkened around a region, in rows (columns
// count as their width over the row height), how dark right at its edge, and
// how fast it eases off (a gaussian: higher is tighter).
const SHADOW_REACH = 4;
const SHADOW_DEPTH = 0.95;
const SHADOW_FALLOFF = 2.2;


export class Scene {
    metrics: Metrics | null = null;
    private buf = new CellBuffer(0, 0);    // front: the page
    private back = new CellBuffer(0, 0);   // back: the rain, screen rows plus one either side
    private renderer: Renderer;
    private backRenderer: Renderer;
    private light = new Float32Array(0);   // the rain's light, per front cell
    private rain = new Rain();
    private regions: Region[] = [];
    private raf = 0;
    private last = 0;
    private time = 0;
    private snap = new CellBuffer(0, 0);   // cells under a revealing region, before it paints
    /** A ring transition in progress: components added meanwhile decode in with it. */
    private ring: { reveal: Reveal; end: number } | null = null;
    private palette = paletteVersion();
    /** The element the page scrolls in. */
    scroller: HTMLElement | null = null;
    /** The page itself, inside the scroller: positions are measured from its top left. */
    content: HTMLElement | null = null;
    /** Page row of buffer row 0. */
    private row0 = NaN;
    /** Page row at the top of the screen. */
    private viewTop = 0;

    constructor(front: HTMLCanvasElement, back: HTMLCanvasElement) {
        this.renderer = new Renderer(front, 'front');
        this.backRenderer = new Renderer(back, 'back');
    }

    setMetrics(m: Metrics) {
        this.metrics = m;
        this.buf = new CellBuffer(m.bufCols, m.bufRows);
        this.snap = new CellBuffer(m.bufCols, m.bufRows);
        this.back = new CellBuffer(m.cols, m.rows + 2);
        this.light = new Float32Array(m.bufCols * m.bufRows);
        this.rain.resize(m.cols, m.rows + 2);
        this.renderer.resize(m);
        this.backRenderer.resize(m);
        this.row0 = NaN;
        for (const r of this.regions) r.textDirty = true;
    }

    /**
     * Draws `paint` into whatever cells `el` covers. With `mirror`, the
     * painter also gets the element's text, cell by cell, so it can draw the
     * text itself (the HTML copy stays for selection, links and screen readers).
     * With `shadow`, the rain around it is darkened.
     * Returns an unregister function.
     */
    add(el: HTMLElement, paint: Painter, { mirror = false, shadow = false } = {}) {
        let depth = 0;
        for (let n: HTMLElement | null = el; n; n = n.parentElement) depth++;
        const region: Region = {
            el, paint, depth, tx: 0, ty: 0, rect: null,
            mirror: null, text: [], textDirty: mirror, reveal: null, shadow,
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
        this.anchor(m);
        const top = this.viewTop - this.row0;   // buffer row at the top of the screen
        const reveal: Reveal = {
            start: clock(), seed: 7,
            shape: { kind: 'ring', x: m.bufCols / 2, y: top + 1 + m.rows / 2, aspect: m.cwDev / m.chDev },
        };
        const length = revealLength(reveal, { col: 0, row: top, w: m.bufCols, h: m.rows + 2 });
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
            this.backRenderer.invalidate();
            // Mirrored text holds colors read from CSS.
            for (const r of this.regions) r.textDirty = true;
        }

        this.anchor(m);
        this.layout(m);
        this.rain.paint(this.back, !rain);
        this.buf.clear(P.bg);
        if (rain) this.mapLight();
        const t = clock();
        // Shadows only show against the rain.
        if (rain) this.shadows(m, t);
        for (const r of this.regions) {
            if (!r.rect) continue;
            const frame = { time: this.time, still, light: this.light, text: r.text };
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

        this.backRenderer.draw(this.back);
        this.renderer.draw(this.buf);
    }

    /** The rain's light (screen rows) for each front cell (page rows), for painters lit by the rain. */
    private mapLight() {
        const { buf, back, light } = this;
        const cols = buf.cols;
        for (let y = 0; y < buf.rows; y++) {
            // Back row 0 is the partly visible row above the screen's first whole row.
            const b = this.row0 + y - this.viewTop + 1;
            const row = light.subarray(y * cols, (y + 1) * cols);
            if (b >= 0 && b < back.rows) row.set(this.rain.light.subarray(b * cols, (b + 1) * cols));
            else row.fill(0);
        }
    }

    /**
     * Shadows: the page color laid over the rain round every region that casts
     * one, strongest at its edge and easing off. Where two overlap (the gap
     * between cards) they combine like two layers of tint, never past opaque. A region still decoding in casts its shadow only where the front
     * has passed, so the shadows arrive with it instead of ahead of it.
     */
    private shadows(m: Metrics, t: number) {
        const { buf } = this;
        const shade = buf.shade;
        const aspect = m.cwDev / m.chDev;
        const reachX = Math.ceil(SHADOW_REACH / aspect);
        for (const r of this.regions) {
            if (!r.shadow || !r.rect || r.reveal?.hide) continue;
            const { col, row, w, h } = r.rect;
            const rv = r.reveal;
            for (let y = Math.max(0, row - SHADOW_REACH); y < Math.min(buf.rows, row + h + SHADOW_REACH); y++) {
                const dy = y < row ? row - y : y >= row + h ? y - (row + h - 1) : 0;
                for (let x = Math.max(0, col - reachX); x < Math.min(buf.cols, col + w + reachX); x++) {
                    const dx = (x < col ? col - x : x >= col + w ? x - (col + w - 1) : 0) * aspect;
                    const d = Math.hypot(dx, dy) / SHADOW_REACH;
                    if (d >= 1) continue;
                    let k = d === 0 ? 1 : SHADOW_DEPTH * Math.exp(-((d * SHADOW_FALLOFF) ** 2));
                    if (rv) k *= revealPassed(rv, x, y, r.rect, t);
                    const i = y * buf.cols + x;
                    const prev = shade[i] / 255;
                    const both = 1 - (1 - prev) * (1 - k);
                    // 32 steps: smooth enough, and few distinct colors to cache.
                    shade[i] = Math.min(255, Math.round(both * 32) * 8);
                }
            }
        }
    }

    private snapshot(r: CellRect) {
        for (let y = Math.max(0, r.row); y < Math.min(this.buf.rows, r.row + r.h); y++) {
            for (let x = Math.max(0, r.col); x < Math.min(this.buf.cols, r.col + r.w); x++) {
                this.snap.copyCell(this.buf, y * this.buf.cols + x);
            }
        }
    }

    /** Keeps the screen inside the canvas, moving the canvas when scrolling nears its ends. */
    private anchor(m: Metrics) {
        const scrollDev = (this.scroller?.scrollTop ?? 0) * m.dpr;
        this.viewTop = Math.floor((scrollDev - m.oyDev) / m.chDev);
        const first = this.viewTop, last = this.viewTop + m.rows + 2;
        if (!(first >= this.row0 && last <= this.row0 + m.bufRows)) {
            this.row0 = this.viewTop - m.margin;
            this.renderer.setAnchor(this.row0);
        }
    }

    private layout(m: Metrics) {
        const { dpr, cwDev, chDev, oxDev, oyDev } = m;
        const page = this.content?.getBoundingClientRect();
        const px = page?.left ?? 0, py = page?.top ?? 0;
        for (const r of this.regions) {
            const b = r.el.getBoundingClientRect();
            if (b.width === 0 && b.height === 0) {
                r.rect = null;
                continue;
            }
            // Where CSS layout put the element on the page, before our nudge.
            // Scrolling doesn't change it, so the nudge stays put.
            const left = b.left - r.tx - px;
            const top = b.top - r.ty - py;
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
            r.rect = { col, row: row - this.row0, w, h };
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

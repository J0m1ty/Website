// Decoding components in and out of the background.
//
// A front passes through the component: on one side is the background, at
// the front a bright 0/1, behind it a short trail of fading digits, and past
// that the component itself. Two shapes:
//   fall: the front falls top to bottom like a rain stream (the boot sequence)
//   ring: the front spreads out from a point (the splash transition)
// With `hide`, it runs the other way round: the component is there until the
// front reaches it, and gone after.

import { CellBuffer, mix, SPACE } from './buffer';
import { P } from './palette';
import { hash } from './hash';
import type { Metrics } from './metrics';
import type { CellRect } from './scene';

export const BOOT_DELAY = 0.2;      // seconds before the first component starts
export const BOOT_STAGGER = 0.3;    // seconds between one component starting and the next

interface Front {
    speed: number;      // rows per second
    trail: number;      // rows of digits behind the front
    jitter: number;     // rows: how ragged the front is
}
const FALL: Front = { speed: 16, trail: 4, jitter: 5 };
const RING: Front = { speed: 40, trail: 7, jitter: 3 };


export type RevealShape =
    | { kind: 'fall' }
    | { kind: 'ring'; x: number; y: number; aspect: number };  // centre in buffer cells; cell width / height

export interface Reveal { start: number; seed: number; shape: RevealShape; hide?: boolean }

const front = (rv: Reveal) => (rv.shape.kind === 'ring' ? RING : FALL);

// The ring's edge wobbles smoothly with the angle (LOBES bumps around the
// circle) plus a little per-cell grain. Pure per-cell noise made the edge
// speckled: single cells finished early and showed as squares of card fill
// inside the band of digits, which stood out on the light theme.
const LOBES = 4;
const GRAIN = 0.4;      // share of the jitter that stays per-cell

/** Smooth noise in [0, 1) around a circle; `u` in turns. */
function ringNoise(u: number, seed: number) {
    const p = (((u % 1) + 1) % 1) * LOBES;
    const i = Math.floor(p), t = p - i;
    const a = hash(i % LOBES, seed, 3), b = hash((i + 1) % LOBES, seed, 3);
    return a + (b - a) * t * t * (3 - 2 * t);
}

/** How far (in rows) the front travels before reaching a cell. */
function distance(rv: Reveal, x: number, y: number, r: CellRect) {
    const f = front(rv);
    const s = rv.shape;
    if (s.kind === 'fall') return (y - r.row) + hash(x - r.col, rv.seed, 11) * f.jitter;
    const dx = (x + 0.5 - s.x) * s.aspect, dy = y + 0.5 - s.y;
    const wobble = ringNoise(Math.atan2(dy, dx) / (2 * Math.PI), rv.seed) * (1 - GRAIN) + hash(x, y, rv.seed) * GRAIN;
    return Math.sqrt(dx * dx + dy * dy) + wobble * f.jitter;
}

/** The furthest any cell of the rect is from where the front starts, in rows. */
function reach(rv: Reveal, r: CellRect) {
    const s = rv.shape;
    if (s.kind === 'fall') return r.h;
    let max = 0;
    for (const [x, y] of [[r.col, r.row], [r.col + r.w, r.row], [r.col, r.row + r.h], [r.col + r.w, r.row + r.h]]) {
        max = Math.max(max, Math.hypot((x - s.x) * s.aspect, y - s.y));
    }
    return max;
}

/** Seconds from the start until the front has finished with the whole rect. */
export function revealLength(rv: Reveal, r: CellRect) {
    const f = front(rv);
    return (reach(rv, r) + f.jitter + f.trail) / f.speed;
}

export function revealDone(rv: Reveal, r: CellRect, t: number) {
    return t - rv.start >= revealLength(rv, r);
}

/**
 * `buf` holds the component painted over `snap` (the same cells just before
 * it was painted). Cells the front says shouldn't show go back to `snap`;
 * cells in the trail get the falling digits.
 */
export function applyReveal(buf: CellBuffer, snap: CellBuffer, r: CellRect, rv: Reveal, t: number) {
    const f = front(rv);
    const trailTime = f.trail / f.speed;
    const flick = Math.floor(t * 12);
    for (let y = r.row; y < r.row + r.h; y++) {
        for (let x = r.col; x < r.col + r.w; x++) {
            if (!buf.has(x, y)) continue;
            const e = t - rv.start - distance(rv, x, y, r) / f.speed;
            const shown = rv.hide ? e < 0 : e >= trailTime;
            if (shown) continue;
            const i = y * buf.cols + x;
            buf.copyCell(snap, i);
            if (e >= 0 && e < trailTime) trailCell(buf, i, x, y, 1 - e / trailTime, flick + rv.seed);
        }
    }
}

/** A digit in the trail; k is 1 at the front, fading back along the trail. */
function trailCell(buf: CellBuffer, i: number, x: number, y: number, k: number, step: number) {
    buf.glyph[i] = hash(x, y, step) < 0.5 ? 48 : 49;
    buf.fg[i] = mix(P.revealTail, P.revealHead, k * k);
    buf.flags[i] = 0;
    buf.aux[i] = 0;
    buf.under[i] = SPACE;
}

/** Draws the front's band of digits across the whole screen, background included. */
export function paintFront(buf: CellBuffer, rv: Reveal, t: number) {
    const f = front(rv);
    const trailTime = f.trail / f.speed;
    const flick = Math.floor(t * 12);
    const all = { col: 0, row: 0, w: buf.cols, h: buf.rows };
    for (let y = 0; y < buf.rows; y++) {
        for (let x = 0; x < buf.cols; x++) {
            const e = t - rv.start - distance(rv, x, y, all) / f.speed;
            if (e >= 0 && e < trailTime) trailCell(buf, y * buf.cols + x, x, y, 1 - e / trailTime, flick + rv.seed);
        }
    }
}

/** CSS clip-path showing only the part of the element's HTML the front has finished with. */
export function revealClip(rv: Reveal, r: CellRect, m: Metrics, t: number) {
    const f = front(rv);
    const done = (t - rv.start) * f.speed - f.trail - f.jitter;   // rows fully finished
    const s = rv.shape;
    if (s.kind === 'fall') {
        const rows = Math.max(0, Math.min(r.h, Math.floor(done) + 1));
        return `inset(0 0 ${(r.h - rows) * m.ch}px 0)`;
    }
    const radius = Math.max(0, done) * m.ch;
    return `circle(${radius}px at ${(s.x - r.col) * m.cw}px ${(s.y - r.row) * m.ch}px)`;
}

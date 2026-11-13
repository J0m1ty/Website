// Every color the grid draws, canvas and CSS alike.
//
// The colors are written once, as the original green-on-black look. Every
// other theme is derived from them in OKLab (a color space where lightness
// matches what the eye sees): other hues rotate the hue and keep lightness and
// chroma, mono drops the chroma, and light mode flips lightness. Green/dark
// therefore stays exactly as designed, and the other themes keep its contrast.
//
// Painters read `P` when they paint, so a theme change takes effect on the next frame.

import { mix, rgb } from './buffer';

export const THEMES = ['green', 'amber', 'cyan', 'violet', 'mono'] as const;
export type Theme = (typeof THEMES)[number];

/** OKLCH hue (degrees) each theme's accent lands on. Green is the original. */
const HUES: Record<Theme, number | null> = { green: null, amber: 70, cyan: 205, violet: 300, mono: null };

// ── The original palette ──────────────────────────────────────────────────

const BASE = {
    bg: rgb(0, 0, 0),
    fill: rgb(5, 15, 9),            // inside a card
    border: rgb(45, 190, 95),
    title: rgb(190, 255, 205),      // card titles
    ink: rgb(166, 232, 182),        // body text
    strong: rgb(200, 255, 214),
    link: rgb(114, 255, 163),
    dim: rgb(79, 154, 102),
    selection: rgb(29, 138, 70),
    selectionInk: rgb(240, 255, 243),
    focus: rgb(45, 190, 95),
    rainHead: rgb(215, 255, 225),
    hot: rgb(130, 255, 175),        // logo glitch digits
    steady: rgb(35, 175, 85),       // logo, rain glow: unlit
    rainLit: rgb(225, 255, 232),    // logo, rain glow: lit
    flash: rgb(240, 255, 244),      // logo glitch rows
    promptLow: rgb(40, 170, 85),
    promptHigh: rgb(225, 255, 232),
    revealHead: rgb(225, 255, 232),
    revealTail: rgb(20, 120, 60),
};

const RAIN_LEVELS = 16;
// Rain: resting field to lit stream, quantized so the glyph atlas stays small.
const BASE_RAIN = Array.from({ length: RAIN_LEVELS }, (_, i) =>
    mix(rgb(0, 30, 12), rgb(40, 235, 105), Math.pow(i / (RAIN_LEVELS - 1), 1.7)));
// Logo shimmer, dark to light.
const BASE_SHIMMER = Array.from({ length: 8 }, (_, i) => mix(rgb(40, 200, 95), rgb(225, 255, 232), i / 7));

export type Palette = typeof BASE & { rain: number[]; shimmer: number[] };

// ── OKLab ─────────────────────────────────────────────────────────────────

const toLinear = (c: number) => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const fromLinear = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function toLab(c: number): [number, number, number] {
    const r = toLinear((c >> 16) & 255), g = toLinear((c >> 8) & 255), b = toLinear(c & 255);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ];
}

/** Linear sRGB for an OKLab color; may fall outside 0..1 (out of gamut). */
function fromLab(L: number, a: number, b: number): [number, number, number] {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    return [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ];
}

/** OKLCH to a packed color, giving up chroma (never hue or lightness) until it fits in sRGB. */
function fromLch(L: number, C: number, h: number): number {
    for (let i = 0; i < 40; i++, C *= 0.92) {
        const [r, g, b] = fromLab(L, C * Math.cos(h), C * Math.sin(h));
        const ok = [r, g, b].every((v) => v > -0.001 && v < 1.001);
        if (ok || C < 1e-4) {
            const ch = (v: number) => Math.max(0, Math.min(255, Math.round(fromLinear(Math.max(0, v)))));
            return rgb(ch(r), ch(g), ch(b));
        }
    }
    return rgb(0, 0, 0);
}

const DEG = Math.PI / 180;
const [, ba, bb] = toLab(BASE.border);
const BASE_HUE = Math.atan2(bb, ba);

function derive(theme: Theme, light: boolean, depth = 0.95) {
    const hue = HUES[theme];
    const shift = hue === null ? 0 : hue * DEG - BASE_HUE;
    const grey = theme === 'mono';
    return (c: number) => {
        if (theme === 'green' && !light) return c;
        const [L, a, b] = toLab(c);
        const C = grey ? 0 : Math.hypot(a, b);
        // Light mode: flip lightness, curved so the dark end (page, card
        // fill, resting rain) stays close to paper and doesn't become grey
        // slabs, while text still lands dark. Black becomes #fafafa.
        const L2 = light ? 0.985 - depth * L ** 1.6 : L;
        return fromLch(L2, C, Math.atan2(b, a) + shift);
    };
}

function build(theme: Theme, light: boolean): Palette {
    const f = derive(theme, light);
    const out = {} as Record<string, number>;
    for (const [k, v] of Object.entries(BASE)) out[k] = f(v);
    if (!light) return { ...(out as typeof BASE), rain: BASE_RAIN.map(f), shimmer: BASE_SHIMMER.map(f) };

    // Light mode adjustments.
    const h = HUES[theme] === null ? BASE_HUE : HUES[theme]! * DEG;
    const mono = theme === 'mono';
    // Paper: the page a touch grey, cards near white, both faintly tinted
    // with the theme's hue. (A flipped dark fill came out as tinted slabs.)
    out.bg = fromLch(0.955, mono ? 0 : 0.008, h);
    out.fill = fromLch(0.995, mono ? 0 : 0.004, h);
    // Rain and the decode transitions: the resting field is the page itself
    // (invisible), and streams build to the theme's most vivid color rather
    // than flipping to near-black. (fromLch gives up chroma only as far as the
    // color needs to fit, so asking for a lot gets the most there is.)
    const vivid = fromLch(mono ? 0.45 : 0.68, mono ? 0 : 0.4, h);
    const rain = BASE_RAIN.map((_, i) => mix(out.bg, vivid, Math.pow(i / (BASE_RAIN.length - 1), 1.7)));
    out.rainHead = vivid;
    out.revealHead = vivid;
    out.revealTail = mix(out.bg, vivid, 0.15);
    // The logo and the enter prompt are solid near-black: the shimmer and the
    // pulse ran from dark green to black, which read as muddy blotches on paper.
    const black = f(BASE_SHIMMER[7]);
    out.promptLow = out.promptHigh = black;
    return { ...(out as typeof BASE), rain, shimmer: BASE_SHIMMER.map(() => black) };
}

// ── The live palette ──────────────────────────────────────────────────────

export const P: Palette = build('green', false);
let version = 0;
/** Goes up on every change, so the scene knows to redraw everything. */
export const paletteVersion = () => version;

export const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

export function setTheme(theme: Theme, light: boolean) {
    Object.assign(P, build(theme, light));
    version++;
    // The DOM's colors: custom properties the stylesheet reads.
    const s = document.documentElement.style;
    for (const k of ['bg', 'ink', 'strong', 'link', 'dim', 'selection', 'selectionInk', 'focus', 'border'] as const) {
        s.setProperty(`--c-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`, hex(P[k]));
    }
    s.colorScheme = light ? 'light' : 'dark';
    s.background = hex(P.bg);
}

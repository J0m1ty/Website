// Everything is sized in character cells. The cell size is measured from the
// font once, then rounded to whole *device* pixels, so the canvas and the DOM
// agree exactly on where every column and row starts.

// Loaded in index.html. Also tried: "Space Mono".
export const FONT_FAMILY = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';

export interface Metrics {
    dpr: number;
    fontSize: number;       // CSS px
    advance: number;        // the font's natural character width, CSS px
    cwDev: number;          // cell width, device px (integer)
    chDev: number;          // cell height, device px (integer)
    cw: number;             // cell width, CSS px
    ch: number;             // cell height, CSS px
    cols: number;
    rows: number;
    oxDev: number;          // grid origin (leftover pixels split evenly), device px
    oyDev: number;
    // The canvas grid: the layout grid plus one partly-visible cell on any
    // side with leftover pixels, so the background reaches the screen edges.
    padX: number;           // extra columns on each side (currently 0)
    padY: number;
    bufCols: number;
    bufRows: number;
    bufOxDev: number;       // canvas grid origin, device px (may be negative)
    bufOyDev: number;
    widthDev: number;       // viewport, device px
    heightDev: number;
    width: number;          // viewport, CSS px
    height: number;
}

export function measure(width: number, height: number): Metrics {
    const dpr = window.devicePixelRatio || 1;
    const fontSize = width < 640 ? 13 : 15;

    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    const advance = ctx.measureText('0'.repeat(64)).width / 64;

    const cwDev = Math.max(1, Math.round(advance * dpr));
    const chDev = Math.max(1, Math.round(fontSize * 1.35 * dpr));
    const widthDev = Math.round(width * dpr);
    const heightDev = Math.round(height * dpr);
    // Columns fit inside the screen. Rows are one fewer than fit, so the
    // leftover is 1-2 rows and the partial row at the top and bottom is always
    // at least half visible. (A sliver of a row is mostly the empty space
    // above or below its characters, and read as a black band.)
    const cols = Math.max(1, Math.floor(widthDev / cwDev));
    const rows = Math.max(1, Math.floor(heightDev / chDev) - 1);

    const oxDev = Math.floor((widthDev - cols * cwDev) / 2);
    const oyDev = Math.floor((heightDev - rows * chDev) / 2);
    const padX = 0;
    const padY = 1;

    return {
        dpr, fontSize, advance,
        cwDev, chDev, cw: cwDev / dpr, ch: chDev / dpr,
        cols, rows, oxDev, oyDev,
        padX, padY,
        bufCols: cols + 2 * padX,
        // Plus one row below: while scrolling the canvas shifts up by up to a
        // row (see Scene.frame), and this fills the gap it leaves.
        bufRows: rows + 2 * padY + 1,
        bufOxDev: oxDev - padX * cwDev,
        bufOyDev: oyDev - padY * chDev,
        widthDev, heightDev, width, height,
    };
}

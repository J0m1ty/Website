/** Deterministic noise in [0, 1) for a cell (and optionally a time step or seed). */
export function hash(a: number, b: number, c = 0) {
    let h = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** A clock that keeps running under reduced motion (scene time freezes). */
export const now = () => performance.now() / 1000;

// Kept apart from the components so that editing them during development
// doesn't recreate the context (hot reload would otherwise leave mounted
// components holding the old one).

import { createContext, useContext } from 'react';
import type { Metrics } from './metrics';
import type { Scene } from './scene';

export interface Grid { scene: Scene; metrics: Metrics }
export const GridContext = createContext<Grid | null>(null);

export function useGrid() {
    const grid = useContext(GridContext);
    if (!grid) throw new Error('useGrid must be used inside <GridRoot>');
    return grid;
}

/** CSS lengths in cells, for widths, gaps and padding. */
export const cellsX = (n: number) => `calc(var(--cw) * ${n})`;
export const cellsY = (n: number) => `calc(var(--ch) * ${n})`;

// Viewer settings for the grid page, kept in localStorage. Plain module state
// plus a subscribe function, so React reads it with useSyncExternalStore and
// the scene reads it directly every frame.

import { useSyncExternalStore } from 'react';
import { setTheme, THEMES, type Theme } from './palette';

/** auto follows the OS (prefers-reduced-motion); on and off override it. */
export type Motion = 'auto' | 'on' | 'off';
/** auto follows the OS (prefers-color-scheme). */
export type Mode = 'auto' | 'dark' | 'light';

export interface Settings {
    motion: Motion;
    mode: Mode;
    theme: Theme;
}

// Also the status line's order.
export const OPTIONS: { [K in keyof Settings]: readonly Settings[K][] } = {
    theme: THEMES,
    mode: ['auto', 'dark', 'light'],
    motion: ['auto', 'on', 'off'],
};

// Motion off by default: the plain background reads best. Rain is opt-in.
const DEFAULTS: Settings = { motion: 'off', mode: 'auto', theme: 'green' };
// index.html reads this key too, to paint the right background before any script loads.
const KEY = 'jomity.grid.settings';

function load(): Settings {
    const out = { ...DEFAULTS };
    try {
        const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
        for (const k of Object.keys(OPTIONS) as (keyof Settings)[]) {
            if ((OPTIONS[k] as readonly string[]).includes(saved?.[k])) (out as Record<string, string>)[k] = saved[k];
        }
    } catch { /* private mode, bad JSON: defaults */ }
    return out;
}

let state = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

export const getSettings = () => state;

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    state = { ...state, [key]: value };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* not saved, still applied */ }
    applyTheme();
    emit();
}

/** Moves a setting on to its next option. */
export function cycleSetting(key: keyof Settings) {
    const opts = OPTIONS[key] as readonly string[];
    setSetting(key, opts[(opts.indexOf(state[key]) + 1) % opts.length] as Settings[typeof key]);
}

export function subscribe(fn: () => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
}

export const useSettings = () => useSyncExternalStore(subscribe, getSettings);

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const lightQuery = window.matchMedia('(prefers-color-scheme: light)');

/** True when effects should hold still: the setting, or the OS when it's auto. */
export const reducedMotion = () => state.motion === 'off' || (state.motion === 'auto' && motionQuery.matches);
export const lightMode = () => state.mode === 'light' || (state.mode === 'auto' && lightQuery.matches);

const applyTheme = () => setTheme(state.theme, lightMode());

motionQuery.addEventListener('change', emit);
lightQuery.addEventListener('change', () => { applyTheme(); emit(); });
applyTheme();

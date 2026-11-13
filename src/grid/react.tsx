import {
    useEffect, useLayoutEffect, useRef, useState,
    type CSSProperties, type ReactNode, type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import { cellsX, cellsY, GridContext, useGrid, type Grid } from './context';
import { FONT_FAMILY, measure } from './metrics';
import { now } from './hash';
import {
    bannerSize, paintBanner, paintClear, paintPanel, paintPrompt, paintRainPanel,
    type BannerGlow, type BannerLook, type BorderStyle,
} from './painters';
import { Scene, type Painter } from './scene';
import { cycleSetting, OPTIONS, useSettings, type Settings } from './settings';

/**
 * Full-screen canvas plus a DOM layer laid over it on the same grid.
 * Children are ordinary HTML laid out with ordinary CSS.
 */
/** With `boot`, the components on screen at first decode in one by one (see Scene.boot). */
export function GridRoot({ children, boot = true }: { children: ReactNode; boot?: boolean }) {
    const bootRef = useRef(boot);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [grid, setGrid] = useState<Grid | null>(null);

    useEffect(() => {
        let scene: Scene | null = null;
        let cancelled = false;
        let booted = false;

        const resize = () => {
            if (!scene) return;
            const metrics = measure(window.innerWidth, window.innerHeight);
            scene.setMetrics(metrics);
            // Re-layout the DOM now, then paint now, so canvas and text never
            // disagree for a frame.
            flushSync(() => setGrid({ scene: scene!, metrics }));
            // First layout: the components are mounted now, so start the boot
            // sequence before anything is painted.
            if (!booted) {
                if (bootRef.current) scene.boot();
                booted = true;
            }
            scene.frame();
        };

        (async () => {
            // Measuring before the web font loads would size cells for the fallback font.
            await Promise.all([
                document.fonts.load(`400 16px ${FONT_FAMILY}`),
                document.fonts.load(`700 16px ${FONT_FAMILY}`),
            ]).catch(() => {});
            if (cancelled || !canvasRef.current) return;
            scene = new Scene(canvasRef.current);
            resize();
            scene.start();
            window.addEventListener('resize', resize);
        })();

        return () => {
            cancelled = true;
            scene?.stop();
            window.removeEventListener('resize', resize);
        };
    }, []);

    // Scroll in whole rows. Pixel scrolling made the snapping fight back: a
    // tiny scroll moved the text a few pixels, then the next frame snapped it
    // back to the same row.
    const rootRef = useRef<HTMLDivElement>(null);
    const ch = grid?.metrics.ch;
    useEffect(() => {
        const root = rootRef.current;
        if (!root || !ch) return;
        let pending = 0;
        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey || root.scrollHeight <= root.clientHeight) return;
            e.preventDefault();
            pending += e.deltaMode === 1 ? e.deltaY * ch
                : e.deltaMode === 2 ? e.deltaY * root.clientHeight
                : e.deltaY;
            const rows = Math.trunc(pending / ch);
            if (!rows) return;
            pending -= rows * ch;
            root.scrollTop = Math.round(root.scrollTop / ch) * ch + rows * ch;
        };
        // Touch, keyboard and scrollbar scrolling stay native; settle on a row when they stop.
        const onScrollEnd = () => {
            const target = Math.round(root.scrollTop / ch) * ch;
            if (Math.abs(target - root.scrollTop) > 0.5) root.scrollTo({ top: target });
        };
        root.addEventListener('wheel', onWheel, { passive: false });
        root.addEventListener('scrollend', onScrollEnd);
        return () => {
            root.removeEventListener('wheel', onWheel);
            root.removeEventListener('scrollend', onScrollEnd);
        };
    }, [ch, grid]);

    const m = grid?.metrics;
    return (
        <>
            <canvas ref={canvasRef} className="grid-canvas" aria-hidden />
            {grid && m && (
                <GridContext.Provider value={grid}>
                    <div
                        ref={rootRef}
                        className="grid-root"
                        style={{
                            left: m.oxDev / m.dpr,
                            top: m.oyDev / m.dpr,
                            width: m.cols * m.cw,
                            fontFamily: FONT_FAMILY,
                            height: m.rows * m.ch,
                            '--cw': `${m.cw}px`,
                            '--ch': `${m.ch}px`,
                            '--fs': `${m.fontSize}px`,
                            // stretches the font's own spacing to exactly one cell per character
                            '--ls': `${m.cw - m.advance}px`,
                        } as CSSProperties}
                    >
                        {children}
                    </div>
                </GridContext.Provider>
            )}
        </>
    );
}

/** Paints into whatever cells the element covers, every frame. */
export function useCellRegion(ref: RefObject<HTMLElement | null>, paint: Painter, { mirror = false } = {}) {
    const { scene } = useGrid();
    const paintRef = useRef(paint);
    useLayoutEffect(() => { paintRef.current = paint; });
    useLayoutEffect(() => {
        if (!ref.current) return;
        return scene.add(ref.current, (buf, rect, frame) => paintRef.current(buf, rect, frame), { mirror });
    }, [scene, ref, mirror]);
}

interface PanelProps {
    title?: string;
    /** solid: filled card. rain: no background; border and text are lit by the rain. */
    fill?: 'solid' | 'rain';
    border?: BorderStyle;
    width?: number;         // in cells
    className?: string;
    children: ReactNode;
}

/** A bordered card. Its contents are real, selectable HTML. */
export function Panel({ title, fill = 'solid', border = 'round', width, className, children }: PanelProps) {
    const ref = useRef<HTMLElement>(null);
    const rain = fill === 'rain';
    useCellRegion(
        ref,
        (buf, rect, frame) => rain
            ? paintRainPanel(buf, rect, frame, border, title)
            : paintPanel(buf, rect, border, title),
        { mirror: rain },
    );
    return (
        <section
            ref={ref}
            aria-label={title}
            className={`panel ${rain ? 'panel-rain' : ''} ${className ?? ''}`}
            style={{ width: width ? cellsX(width) : undefined }}
        >
            {children}
        </section>
    );
}

interface BannerProps {
    text: string;
    glow?: BannerGlow;
    look?: BannerLook;
    /** Pixel size; by default 2 on big screens, else 1. */
    scale?: number;
}

/** Big decorative letters drawn on the canvas; screen readers get the text. Click to glitch. */
export function Banner({ text, glow = 'shimmer', look = 'blocks', scale: fixed }: BannerProps) {
    const { metrics } = useGrid();
    const scale = fixed ?? (metrics.cols >= 110 && metrics.rows >= 40 ? 2 : 1);
    const size = bannerSize(text, scale);
    const ref = useRef<HTMLHeadingElement>(null);
    // Clicking the logo glitches it. Real clock, so it works under reduced motion too.
    const glitch = useRef({ start: -Infinity, length: 0, seed: 0 });
    useCellRegion(ref, (buf, rect, frame) => {
        const g = glitch.current;
        const t = now() - g.start;
        paintBanner(buf, rect, text, {
            time: frame.time, scale, look, glow, light: frame.light,
            glitch: t < g.length ? { seed: g.seed, t } : null,
        });
    });
    return (
        <h1
            ref={ref}
            onClick={() => {
                glitch.current = { start: now(), length: 0.12 + Math.random() * 0.25, seed: (Math.random() * 1e6) | 0 };
            }}
            style={{ width: cellsX(size.w), height: cellsY(size.h), flexShrink: 0, cursor: 'pointer' }}
        >
            <span className="sr-only">{text}</span>
        </h1>
    );
}

/** A pulsing one-line prompt drawn on the canvas, on a real (focusable) button. */
export function Prompt({ label, srLabel, onActivate }: { label: string; srLabel: string; onActivate: () => void }) {
    const ref = useRef<HTMLButtonElement>(null);
    useCellRegion(ref, (buf, rect, frame) => paintPrompt(buf, rect, label, frame.time));
    return (
        <button
            ref={ref}
            type="button"
            className="grid-prompt"
            onClick={onActivate}
            style={{ width: cellsX([...label].length + 2), height: cellsY(1) }}
        >
            <span className="sr-only">{srLabel}</span>
        </button>
    );
}

const STATUS_ITEMS = Object.keys(OPTIONS) as (keyof Settings)[];

/** Clears the rain right behind its contents so they read. */
function Clear({ children, className }: { children: ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    useCellRegion(ref, (buf, rect) => paintClear(buf, rect));
    return <div ref={ref} className={className}>{children}</div>;
}

/**
 * The page's last row: the settings on the left, each a real button that
 * cycles its setting, and text on the right. `right` lists versions of that
 * text, longest first; the first that fits beside the settings is used. If
 * none fits, the shortest goes on a second row, right-aligned. It
 * spans `width` cells, centred, so it lines up with the cards above.
 */
export function StatusLine({ width, right = [] }: { width: number; right?: string[] }) {
    const settings = useSettings();
    // "key:value" per item, two cells between items, two before the right text.
    const used = STATUS_ITEMS.reduce((n, k) => n + k.length + 1 + settings[k].length, 0) + 2 * (STATUS_ITEMS.length - 1);
    const text = right.find((t) => used + 2 + [...t].length <= width) ?? right.at(-1);
    return (
        <footer className="grid-status" style={{ width: cellsX(width) }}>
            <Clear>
            <nav aria-label="Settings">
                {STATUS_ITEMS.map((key) => (
                    <button
                        key={key}
                        type="button"
                        className="grid-status-item"
                        onClick={() => cycleSetting(key)}
                        aria-label={`${key}: ${settings[key]}. Change`}
                    >
                        {key}:<span className="value">{settings[key]}</span>
                    </button>
                ))}
            </nav>
            </Clear>
            {text && <Clear className="grid-status-right">{text}</Clear>}
        </footer>
    );
}

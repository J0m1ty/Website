import { useEffect, useRef, useState } from 'react';
import { useGrid } from '../grid/context';
import { Banner, GridRoot, Panel, Prompt } from '../grid/react';

// /grid?nosplash skips the splash and boots the page instead.
const skipSplash = new URLSearchParams(window.location.search).has('nosplash');

export default function GridDemo() {
    return (
        <GridRoot boot={skipSplash}>
            <Demo />
        </GridRoot>
    );
}

/**
 * Splash first. Entering sends a ring out from the centre that decodes the
 * splash out and the page in. Both are mounted while the ring runs; the page
 * keeps its place in the tree throughout, so it isn't remounted after.
 */
function Demo() {
    const { scene } = useGrid();
    const [phase, setPhase] = useState<'splash' | 'transition' | 'page'>(skipSplash ? 'page' : 'splash');
    const entered = useRef(false);
    const enter = () => {
        if (entered.current) return;   // a click on the prompt also reaches the splash
        entered.current = true;
        const length = scene.startRing();
        setPhase('transition');
        setTimeout(() => setPhase('page'), length * 1000);
    };
    return (
        <>
            {phase !== 'page' && <Splash onEnter={enter} />}
            {phase !== 'splash' && <Layout />}
        </>
    );
}

function Splash({ onEnter }: { onEnter: () => void }) {
    const { metrics } = useGrid();
    // 2x where it fits, else 1x.
    const scale = Math.max(1, Math.min(2, Math.floor((metrics.cols - 6) / 41), Math.floor((metrics.rows - 8) / 4)));
    const touch = window.matchMedia('(hover: none)').matches;
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') onEnter();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onEnter]);
    return (
        <div className="grid-splash" onClick={onEnter}>
            <Banner text="jomity.net" scale={scale} />
            <Prompt label={touch ? '< tap to enter >' : '< click to enter >'} srLabel="Enter site" onActivate={onEnter} />
        </div>
    );
}

// Breakpoints are just numbers of columns.
function Layout() {
    const { metrics } = useGrid();
    const narrow = metrics.cols < 80;
    const full = narrow ? metrics.cols - 4 : 74;

    return (
        <main className="grid-demo">
            <Banner text="jomity.net" scale={1} />

            <div className="grid-demo-row">
                <Panel title="about" width={narrow ? full : 48}>
                    <p>
                        Hi! This card is a real HTML element, laid out by plain flexbox.
                        Its border, fill and shadow are drawn on the canvas behind it,
                        snapped to the character grid.
                    </p>
                    <p>Try selecting this text. The <strong>1s and 0s</strong> around it won't select.</p>
                    <p>email: <span className="dim">[your email here]</span></p>
                </Panel>

                <Panel title="links" width={narrow ? full : 24}>
                    <ul>
                        <li>&gt; <a href="https://github.com/J0m1ty" target="_blank" rel="noreferrer">github</a></li>
                        <li>&gt; <a href="https://www.linkedin.com/in/jomity/" target="_blank" rel="noreferrer">linkedin</a></li>
                        <li>&gt; <a href="https://open.spotify.com/user/psbmkzrjh8ap9z2j0ioraesci" target="_blank" rel="noreferrer">spotify</a></li>
                        <li>&gt; <a href="https://discord.com/users/544963690185752576" target="_blank" rel="noreferrer">discord</a></li>
                    </ul>
                </Panel>
            </div>

            <Panel title="projects" fill="rain" width={full}>
                <p>
                    A "rain" card: no background, so streams keep falling behind
                    this text. The text is drawn on the canvas; the HTML copy
                    underneath is invisible, but you can still select it.
                </p>
                <ul className="spaced">
                    <li>market maker <span className="dim">- market.jomity.net</span></li>
                    <li>armadahex auth <span className="dim">- auth.jomity.net</span></li>
                    <li>status page <span className="dim">- status.jomity.net</span></li>
                </ul>
            </Panel>
        </main>
    );
}

import { useEffect, useRef, useState } from 'react';
import { useGrid } from '../grid/context';
import { Banner, GridRoot, Panel, Prompt, StatusLine } from '../grid/react';

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
        <>
        <main className="grid-demo">
            <Banner text="jomity.net" scale={1} />

            <div className="grid-demo-row">
                <Panel title="about" width={narrow ? full : 48}>
                    <p>
                        Hi, I'm <strong>Jonathan Schultz</strong> (Jomity). I study
                        computer science and math at RIT, and I'm a software
                        engineering intern at Lockheed Martin.
                    </p>
                    <p>
                        I like backend work on distributed systems. Away from
                        the keyboard I lift, row, play chess and do competitive
                        programming and math.
                    </p>
                    <p>email: <a href="mailto:jomity@hotmail.com">jomity@hotmail.com</a></p>
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

            <Panel title="experience" width={full}>
                <ul className="entries">
                    <Entry
                        title="Lockheed Martin" role="embedded software engineering intern" when="2026 - now"
                        text="Moving legacy C++ telemetry tools to Python and React, rewriting HDLC serial protocols, and building CI pipelines (test coverage 0 to 90%)."
                    />
                    <Entry
                        title="Insidyr Technologies" role="co-founder" when="2025 - now"
                        text="A zero-commission trading platform on Discord and the web: Alpaca, Stripe, Cloudflare Workers, and an Elixir/OTP service for live trade streams."
                    />
                    <Entry
                        title="RIT" role="undergraduate teaching assistant" when="2025"
                        text="Taught and graded Intro to Software Engineering; ran workshops on OOP and software design."
                    />
                </ul>
            </Panel>

            <Panel title="projects" width={full}>
                <ul className="entries">
                    <Entry
                        title="jombox" link="https://status.jomity.net" linkText="status.jomity.net"
                        text="The Linux VPS behind this site: web services, APIs and game servers in Docker, for 2K+ visitors a month."
                    />
                    <Entry
                        title="market maker" link="https://market.jomity.net" linkText="market.jomity.net"
                        text="A real-time supply-and-demand simulator used for live classroom demos at RIT."
                    />
                    <Entry
                        title="secure messenger"
                        text="Peer-to-peer chat in C#: RSA key exchange, AES, and a fault-tolerant UDP mesh."
                    />
                    <Entry
                        title="armadahex" link="https://armadahex.blogspot.com" linkText="armadahex.blogspot.com"
                        text="Battleship with hexagons: a multiplayer Unity game built by a team of 7, with its own auth server."
                    />
                </ul>
                <p>more on <a href="https://github.com/J0m1ty" target="_blank" rel="noreferrer">github</a></p>
            </Panel>
        </main>
        {/* Only on the page, never the splash: the ring would decode it out for good. */}
        <StatusLine />
        </>
    );
}

interface EntryProps {
    title: string;
    role?: string;
    when?: string;
    link?: string;
    linkText?: string;
    text: string;
}

/** One item in a list card: a bold title, a dim role/date or link, then a line or two. */
function Entry({ title, role, when, link, linkText, text }: EntryProps) {
    return (
        <li>
            <div>
                <strong>{title}</strong>
                {role && <span className="dim"> - {role}</span>}
                {when && <span className="dim">, {when}</span>}
                {link && <> <span className="dim">-</span> <a href={link} target="_blank" rel="noreferrer">{linkText}</a></>}
            </div>
            <p>{text}</p>
        </li>
    );
}

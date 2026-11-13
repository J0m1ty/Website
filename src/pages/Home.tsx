import { useEffect, useRef, useState } from 'react';
import { useGrid } from '../grid/context';
import { Banner, GridRoot, Panel, Prompt, StatusLine } from '../grid/react';
import { COURSES, GPA, JOBS, JOBS_PREVIEW, LINKS, PERSONAL, SCHOOL, type Job, type Link, type Project } from './content';

export default function Home() {
    return (
        <GridRoot boot={false}>
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
    const [phase, setPhase] = useState<'splash' | 'transition' | 'page'>('splash');
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

const YEAR = new Date().getFullYear();

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
                        computer science and math at RIT, and I founded Insidyr.
                        I'm most interested in backend work on distributed systems.
                    </p>
                    <p className="dim">...loading other interests...</p>
                    <p>
                        I lift, row, listen to a lot of music, do competitive
                        programming and math, and play chess. Challenge me at
                        Beat Saber, I dare you!
                    </p>
                </Panel>

                <Panel title="links" width={narrow ? full : 24}>
                    {/* A column per group when the card is full width, else one list with a row between groups. */}
                    <div className={narrow ? 'link-columns' : 'link-groups'}>
                        {LINKS.map((group, i) => (
                            <ul key={i}>
                                {group.map((l) => <li key={l.label}>&gt; <ExtLink link={l} /></li>)}
                            </ul>
                        ))}
                    </div>
                </Panel>
            </div>

            <Panel title="experience" width={full}>
                <More items={JOBS} preview={JOBS_PREVIEW} render={(job) => <JobEntry job={job} />} />
            </Panel>

            <Panel title="personal projects" width={full}>
                <More items={PERSONAL} show={2} render={(p) => <ProjectEntry project={p} />} />
            </Panel>

            <Panel title="school projects" width={full}>
                <More items={SCHOOL} show={2} render={(p) => <ProjectEntry project={p} />} />
            </Panel>

            <Panel title="coursework" width={full}>
                <More items={COURSES} show={2} summary={<p className="dim">{GPA}</p>} render={(t) => (
                    <>
                        <strong>{t.term}</strong>
                        <ul>
                            {t.courses.map(([code, name]) => <li key={code}><span className="dim">{code}</span> {name}</li>)}
                        </ul>
                    </>
                )} />
            </Panel>
        </main>
        {/* Only on the page, never the splash: the ring would decode it out for good. */}
        <StatusLine width={full} right={[`© ${YEAR} Jonathan Schultz`, `© ${YEAR}`]} />
        </>
    );
}

/** Opens off-site links in a new tab; mail and same-site links open normally. */
function ExtLink({ link }: { link: Link }) {
    const external = /^https?:/.test(link.href);
    return (
        <a href={link.href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{link.label}</a>
    );
}

interface MoreProps<T> {
    items: T[];
    /** What shows collapsed: the first `show` items, or a hand-picked `preview`. */
    show?: number;
    preview?: T[];
    /** A line under the full list, shown only once expanded. */
    summary?: React.ReactNode;
    render: (item: T) => React.ReactNode;
}

/** A short list, and a text button that expands it to the full one. */
function More<T>({ items, show = 2, preview, summary, render }: MoreProps<T>) {
    const [open, setOpen] = useState(false);
    const shown = open ? items : preview ?? items.slice(0, show);
    const hidden = items.length - (preview ?? items.slice(0, show)).length;
    return (
        <>
            <ul className="entries">
                {shown.map((item) => <li key={items.indexOf(item)}>{render(item)}</li>)}
            </ul>
            {open && summary}
            {hidden > 0 && (
                <button type="button" className="text-button" aria-expanded={open} onClick={() => setOpen(!open)}>
                    {open ? '> less' : `> ${hidden} more`}
                </button>
            )}
        </>
    );
}

/** Title with its dates on the right, the employer under it, then what it was. */
function JobEntry({ job }: { job: Job }) {
    return (
        <>
            <div className="entry-head">
                <strong>{job.title}</strong>
                <span className="dim">{job.when}</span>
            </div>
            <div className="dim">{job.employer}</div>
            <p>{job.text}</p>
        </>
    );
}

function ProjectEntry({ project: p }: { project: Project }) {
    return (
        <>
            <div className="entry-head">
                <span>
                    {p.star && <span className="star">* </span>}
                    <strong>{p.name}</strong>
                    {p.langs && <span className="dim"> ({p.langs})</span>}
                </span>
                {p.links && (
                    <span className="entry-links">
                        {p.links.map((l) => <ExtLink key={l.href} link={l} />)}
                    </span>
                )}
            </div>
            <p>{p.text}</p>
        </>
    );
}

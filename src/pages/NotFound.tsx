import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useGrid } from '../grid/context';
import { Banner, GridRoot, Prompt } from '../grid/react';

/** Any unknown path: a big "404" and a way home, in the same style as the splash. */
export default function NotFound() {
    return (
        <GridRoot boot>
            <Page />
        </GridRoot>
    );
}

function Page() {
    const { metrics } = useGrid();
    const navigate = useNavigate();
    const home = () => navigate('/');
    // 2x where it fits, else 1x (the banner is 14 cells wide at 1x).
    const scale = Math.max(1, Math.min(2, Math.floor((metrics.cols - 6) / 14), Math.floor((metrics.rows - 8) / 4)));
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') home();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });
    return (
        <main className="grid-splash" onClick={home}>
            <Banner text="404" scale={scale} />
            <p className="sr-only">Page not found.</p>
            <Prompt label="< back home >" srLabel="Back to the home page" onActivate={home} />
        </main>
    );
}

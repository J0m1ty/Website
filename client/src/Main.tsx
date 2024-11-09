import { Box } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { Application, Container } from "pixi.js";
import { constrain, map, random } from "./util/math";
import { isLowEndDevice, Particle } from "./util/Particle";

const Main = () => {
    const mouse = useRef({ x: 0, y: 0, click: false });
    const appRef = useRef<Application | null>(null);
    const containerRef = useRef<Container | null>(null);
    const particles = useRef<Array<Particle> | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const createApp = async () => {
        if (!ref.current || appRef.current) return;
        const app = new Application();

        await app.init({ resizeTo: ref.current, antialias: isLowEndDevice() ? false : true, background: 0x000000, autoDensity: true, resolution: window.devicePixelRatio || 1 });
        ref.current.replaceChildren(app.canvas);
        appRef.current = app;

        containerRef.current = new Container();
        appRef.current.stage.addChild(containerRef.current);

        const len = 5;
        particles.current = Array.from({ length: len }, (_, i) => {
            return new Particle(
                map(i, 0, len, 0, appRef.current.screen.width),
                random(0, appRef.current.screen.height),
                i,
                true,
                true
            );
        });

        containerRef.current.addChild(...particles.current.map(p => p.graphics));

        render();
    }

    const render = () => {
        if (!appRef.current) return;

        let timer = 10;
        appRef.current.ticker.add(() => {
            const dt = appRef.current.ticker.deltaMS / 1000;

            const clicked: number[] = [];
            for (let i = 0; i < particles.current.length; i++) {
                const p = particles.current[i];
                p.graphics.zIndex = i;
                p.update(dt);

                if (mouse.current.click && !p.pop) {
                    const dx = p.pos.x - mouse.current.x;
                    const dy = p.pos.y - mouse.current.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const r = p.size;

                    if (dist < r) {
                        clicked.push(i);
                    }
                }

                if (p.pos.x < -150 || p.pos.x > window.innerWidth + 150 || p.pos.y < -150 || p.pos.y > window.innerHeight + 150) {
                    p.break();
                }
            }

            const max = Math.max(-1, ...clicked);
            if (max !== -1) {
                particles.current[max].pop = true;
            }

            particles.current = particles.current.filter(p => {
                if (p.dead) {
                    appRef.current.stage.removeChild(p.graphics);
                    p.graphics.destroy();
                    return false;
                }

                return true;
            });

            const density = 0.0001 * (isLowEndDevice() ? 0.75 : 1);
            const area = window.innerWidth * window.innerHeight;
            const goalSize = ~~constrain(area * density, 5, 150);
            if (particles.current.length < goalSize) {
                const p = new Particle(
                    random(-10, window.innerWidth + 10),
                    random(-10, window.innerHeight + 10),
                    particles.current.length - 1,
                    timer > 0,
                    false
                );

                particles.current.push(p);
                containerRef.current.addChild(p.graphics);
            }

            if (particles.current.length > goalSize) {
                particles.current[~~random(0, goalSize - 1)].reduceLifetime();
            }

            if (timer > 0) timer -= dt;

            mouse.current.click = false;
        });
        console.log('App created');
    }

    useEffect(() => {
        createApp();

        const moveListener = (e: MouseEvent) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        }
        window.addEventListener('mousemove', moveListener);

        const clickListener = (e: MouseEvent) => {
            mouse.current.click = true;
        }
        window.addEventListener('click', clickListener);

        return () => {
            if (appRef.current) {
                appRef.current.destroy(true, true);
                appRef.current = null;
                console.log('App destroyed');
            }

            window.removeEventListener('mousemove', moveListener);
            window.removeEventListener('click', clickListener);
        };
    }, []);

    return (
        <Box ref={ref} w="100vw" h="100vh" />
    );
}

export default Main;
import { Box } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { Application, BitmapText, Container, Graphics } from "pixi.js";
import { constrain, map, random } from "./util/math";
import { Particle } from "./util/Particle";

const Main = () => {
    const appRef = useRef<Application | null>(null);
    const containerRef = useRef<Container | null>(null);
    const particles = useRef<Array<Particle> | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const createApp = async () => {
        if (!ref.current || appRef.current) return;

        const app = new Application();

        await app.init({ resizeTo: ref.current, antialias: true, backgroundAlpha: 0 });
        ref.current.replaceChildren(app.canvas);
        appRef.current = app;

        containerRef.current = new Container();
        appRef.current.stage.addChild(containerRef.current);

        const len = 5;
        particles.current = Array.from({ length: len }, (_, i) => {
            return new Particle(
                map(i, 0, len, 0, appRef.current.screen.width),
                random(0, appRef.current.screen.height),
                true
            );
        });

        containerRef.current.addChild(...particles.current.map(p => p.graphics));

        render();
    }

    const render = () => {
        if (!appRef.current) return;

        const text = new BitmapText({
            text: "jomity.net",
            style: {
                fontFamily: 'Comfortaa',
                fontSize: 128,
                fill: 0xffffff,
                align: 'center'
            }
        });

        text.anchor.set(0.5);
        text.position.set(appRef.current.screen.width / 2, appRef.current.screen.height / 2);
        appRef.current.stage.addChild(text);

        appRef.current.ticker.add(() => {
            const dt = appRef.current.ticker.deltaMS / 1000;

            for (let i = 0; i < particles.current.length; i++) {
                particles.current[i].update(dt);
            }

            particles.current = particles.current.filter(p => {
                if (p.dead) {
                    appRef.current.stage.removeChild(p.graphics);
                    p.graphics.destroy();
                    return false;
                }

                return true;
            });

            const density = 0.0001;
            const area = appRef.current.screen.width * appRef.current.screen.height;
            const goalSize = ~~constrain(area * density, 5, 150);
            if (particles.current.length < goalSize) {
                const p = new Particle(
                    random(-100, appRef.current.screen.width + 100),
                    random(-100, appRef.current.screen.height + 100),
                    false
                );

                particles.current.push(p);
                containerRef.current.addChild(p.graphics);
            }
            
            if (particles.current.length > goalSize) {
                particles.current[~~random(0, goalSize - 1)].reduceLifetime();
            }

            text.style.fontSize = constrain(map(appRef.current.screen.width, 400, 1920, 18, 128) * 2, 18, 128);
            text.position.set(appRef.current.screen.width / 2, appRef.current.screen.height / 2);
        });

        console.log('App created');
    }

    useEffect(() => {
        createApp();

        return () => {
            if (appRef.current) {
                appRef.current.destroy(true, true);
                appRef.current = null;
                console.log('App destroyed');
            }
        };
    }, []);

    return (
        <Box ref={ref} w="100vw" h="100vh" />
    );
}

export default Main;
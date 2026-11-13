import { BlurFilter, Graphics } from 'pixi.js';
import { IVector } from './IVector';
import { constrain, lerp, lerpColor, map, random, skewedRandom } from './math';

const generate = () => {
    const freq = skewedRandom(0.05, 1, 2);
    const phase = random(0, Math.PI * 2);

    return (t: number) => {
        return map(Math.sin(freq * t + phase), -1, 1, 0.5, 1);
    };
}

export const blurFilters = [
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter()
];

export function isLowEndDevice() {
    const ua = navigator.userAgent.toLowerCase();
    return /iphone|ipad|android|mobile/.test(ua);
}

blurFilters.forEach(filter => {
    filter.strength = random() > 0.1 ? skewedRandom(5, 50, 5) : 5;
    filter.quality = isLowEndDevice() ? 2 : 5;
});

export class Particle {
    readonly graphics: Graphics = new Graphics();
    readonly blurFilterIndex: number = Math.floor(random(0, blurFilters.length));

    index: number = -1;
    pos: IVector;
    vel: IVector;
    acc: IVector;
    lifetime: number;
    timer: number = 0;
    popTimer: number = 1;
    pop: boolean = false;

    readonly baseo: number;
    readonly breathing: (t: number) => number;
    readonly maxLifetime: number;
    readonly jump: boolean;
    readonly fadeIn: number;
    readonly fadeOut: number;
    readonly size: number;
    readonly color: number;

    constructor(x: number, y: number, index: number, rnd: boolean, jump: boolean) {
        this.pos = { x, y };
        this.index = index;
        this.jump = jump;

        let speed = (skewedRandom(0.05, 0.5, 3) / 10) * (random() > 0.8 ? 2 : 1);
        let angle = random(0, Math.PI * 2);
        this.vel = {
            x: speed * Math.cos(angle),
            y: speed * Math.sin(angle)
        };

        this.acc = { x: 0, y: 0 };

        this.baseo = constrain(map(this.index * 10, 0, 1000, 0.5, 1), 0.5, 1);
        this.breathing = generate();
        this.maxLifetime = skewedRandom(30, 60, 0.5);
        if (rnd) this.maxLifetime /= (random() < 0.3 ? 4 : random() < 0.6 ? 2 : 1);
        this.lifetime = this.maxLifetime;
        this.fadeIn = this.maxLifetime * random(0.1, 0.15);
        this.fadeOut = this.maxLifetime * random(0.1, 0.15);

        this.size = 20 + random(0, 50) + skewedRandom(0, 100, 20);
        this.color = lerpColor(0x013220, 0x00ff00, skewedRandom(0, 1, 2));

        this.graphics.filters = [ blurFilters[this.blurFilterIndex] ];

        this.graphics
            .circle(0, 0, this.size)
            .fill({ color: 0xffffff });

        this.graphics.position.set(this.pos.x, this.pos.y);
        this.graphics.alpha = 0;
        this.graphics.zIndex = this.index;
        this.graphics.tint = this.color;
    }

    get opacity() {
        // Start with breathing value
        let val = this.breathing(this.timer) * this.baseo;

        // Apply fade-in
        if (!this.jump && this.lifetime > this.maxLifetime - this.fadeIn) {
            const fadeInProgress = map(
                constrain(this.lifetime, this.maxLifetime - this.fadeIn, this.maxLifetime),
                this.maxLifetime - this.fadeIn,
                this.maxLifetime,
                1,
                0
            );
            val *= fadeInProgress;
        }

        // Apply fade-out
        if (this.lifetime < this.fadeOut) {
            const fadeOutProgress = map(
                constrain(this.lifetime, 0, this.fadeOut),
                this.fadeOut,
                0,
                1,
                0
            );
            val *= fadeOutProgress;
        }

        // Apply pop
        if (this.pop) {
            val *= this.popTimer * 2;
        }

        // Ensure val is within [0, 1]
        val = constrain(val, 0, 1);

        return val;
    }

    get dead() {
        return this.lifetime <= 0;
    }

    reduceLifetime() {
        if (this.lifetime > this.fadeOut && this.lifetime < this.maxLifetime - this.fadeIn) {
            this.lifetime = this.fadeOut;
        }
    }

    break() {
        this.pop = true;
    }

    applyForce(force: IVector) {
        this.acc.x += force.x;
        this.acc.y += force.y;
    }

    update(dt: number) {
        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.acc.x = 0;
        this.acc.y = 0;

        this.graphics.alpha = this.opacity;
        this.lifetime -= dt;
        this.timer += dt;

        if (this.pop) {
            let size = lerp(this.graphics.getSize().width, map(this.popTimer, 1, 0, this.size * 2.5, this.size), 0.5);
            this.graphics.setSize(size, size);

            this.graphics.tint = lerpColor(this.graphics.tint, lerpColor(0x000000, 0x00ff00, this.popTimer), 0.5);

            this.popTimer -= dt;
            if (this.popTimer <= 0) {
                this.lifetime = 0;
            }
        }

        this.graphics.position.set(this.pos.x, this.pos.y);
    }
}